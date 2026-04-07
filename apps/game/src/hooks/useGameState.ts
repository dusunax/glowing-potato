// Top-level game state orchestrator. Composes all sub-hooks and wires them together.
// Components should import from here, not from sub-hooks directly.

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useConditions, type TimeAdvanceResult } from './useConditions';
import { useInventory } from './useInventory';
import { useDiscovery } from './useDiscovery';
import { useItemSpawn } from './useItemSpawn';
import { useCrafting } from './useCrafting';
import { useMap } from './useMap';
import { useActionCards } from './useActionCards';
import { useAnimals } from './useAnimals';
import { getItemById } from '../data/items';
import { ANIMAL_TEMPLATES, createTemplateFromRandomHostileTemplate } from '../data/animals';
import { getMaxUnlockedSpawnLayer } from '../utils/spawning';
import type { GameEvent } from '../types/events';
import type { ActionCard } from '../types/actionCard';
import type { PlayerPosition, MapBiomePreset } from '../types/map';
import type { AnimalRecord } from '../types/score';

const BASE_PLAYER_HP = 10;
const XP_BASE_TO_NEXT_LEVEL = 12;
const XP_LEVEL_GROWTH = 2;
const HP_INCREASE_PER_LEVEL = 2;
const POTION_HEAL = 8;
const MAX_EVENT_LOGS = 12;
const DEFAULT_FOOD_HEAL = 1;
const FOOD_HEAL_BY_ITEM_ID: Record<string, number> = {
  raw_meat: 1,
  grilled_meat: 3,
  hunter_stew: 4,
  mushroom: 2,
  sunberry: 1,
  winter_berry: 1,
};
const BIOME_LABEL_BY_PRESET: Record<MapBiomePreset, string> = {
  meadow: 'Meadow',
  mountain: 'Mountain',
  beach: 'Sea',
  desert: 'Desert',
  rock: 'Rock',
};
export function useGameState(startBiomePreset: MapBiomePreset = 'meadow') {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const eventSequenceRef = useRef(0);
  const [playerHp, setPlayerHp] = useState(BASE_PLAYER_HP);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXp, setPlayerXp] = useState(0);
  const [maxPlayerHp, setMaxPlayerHp] = useState(BASE_PLAYER_HP);
  const [isPlayerDead, setIsPlayerDead] = useState(false);
  const [deathCause, setDeathCause] = useState('');
  const [scoutPoints, setScoutPoints] = useState(0);
  const [selectedSpawnLayer, setSelectedSpawnLayer] = useState(1);
  const maxHpRef = useRef(BASE_PLAYER_HP);
  const playerHpRef = useRef(BASE_PLAYER_HP);
  const [totalXpGained, setTotalXpGained] = useState(0);
  const [defeatedAnimals, setDefeatedAnimals] = useState<AnimalRecord[]>([]);
  const [hasUsedSummonMonster, setHasUsedSummonMonster] = useState(false);
  const isPlayingCardRef = useRef(false);

  const pushEvent = useCallback((message: string, type: GameEvent['type'] = 'info') => {
    const timestamp = Date.now();
    const nextId = ++eventSequenceRef.current;
    const ev: GameEvent = {
      id: `${timestamp}-${nextId}`,
      message,
      type,
      timestamp,
    };
    setEvents((prev) => [...prev, ev].slice(-MAX_EVENT_LOGS));
  }, []);

  useEffect(() => {
    playerHpRef.current = playerHp;
  }, [playerHp]);

  const xpNeededForNextLevel = useCallback(
    (level: number) => XP_BASE_TO_NEXT_LEVEL + (level - 1) * XP_LEVEL_GROWTH,
    []
  );

  const gainExperience = useCallback(
    (amount: number) => {
      if (amount <= 0 || isPlayerDead) return;
      pushEvent(`✨ Gained ${amount} XP.`, 'success');

      let levelUps = 0;
      let hpIncrease = 0;
      let nextLevel = playerLevel;
      let nextMaxHp = maxPlayerHp;
      let nextXp = playerXp + amount;
      let xpNeed = xpNeededForNextLevel(nextLevel);

      while (nextXp >= xpNeed) {
        nextXp -= xpNeed;
        levelUps += 1;
        nextLevel += 1;
        hpIncrease += HP_INCREASE_PER_LEVEL;
        nextMaxHp += HP_INCREASE_PER_LEVEL;
        xpNeed = xpNeededForNextLevel(nextLevel);
      }

      if (levelUps > 0) {
        setPlayerLevel(nextLevel);
        setMaxPlayerHp(nextMaxHp);
        maxHpRef.current = nextMaxHp;
        pushEvent(`⬆️ Level ${nextLevel} reached!`, 'success');
        pushEvent(`❤️ Max HP increased by ${hpIncrease} and you fully recovered to ${nextMaxHp} HP.`, 'success');
      }

      setPlayerXp(nextXp);
      setTotalXpGained((prev) => prev + amount);

      if (levelUps > 0) {
        setPlayerHp(nextMaxHp);
      }
    },
    [isPlayerDead, maxHpRef, maxPlayerHp, playerLevel, playerXp, xpNeededForNextLevel, pushEvent]
  );

  const { conditions, advance, shiftWeather } = useConditions();
  const { inventory, addItem, removeItem, getQuantity } = useInventory();
  const getPlayerAttackDamage = useCallback(() => {
    const bestWeaponAttack = inventory.reduce((maxAttack, slot) => {
      const item = getItemById(slot.itemId);
      if (!item || item.category !== 'weapon') return maxAttack;
      return Math.max(maxAttack, item.attackPower ?? 0);
    }, 0);
    return Math.max(3, bestWeaponAttack);
  }, [inventory]);

  const { discovered, markDiscovered, isDiscovered } = useDiscovery();
  const { 
    position,
    currentBiomeInfo,
    getBiomeInfoAt,
    mapGrid,
    caveTiles,
    visitedTiles,
    knownTiles,
    canMoveTo,
    isAdjacent,
    moveTo,
    consumeTileResource,
    getTileResources,
    replenishTileResources,
    getReachableTiles,
    getPathLength,
    MAP_ROWS,
    MAP_COLS,
  } = useMap(startBiomePreset);
  const { hand, selectedCard, selectCard, playCard, deckSize } = useActionCards({
    currentDay: conditions.day,
    hasUsedSummonMonster,
    onSummonMonsterUsed: () => setHasUsedSummonMonster(true),
  });
  const {
    animals,
    moveAnimals,
    spawnCaveWave,
    spawnCaveWaveWithTemplates,
    attackAnimal,
    getAnimalsAt,
    getAdjacentHostile,
    getAdjacentAnimals,
  } = useAnimals(caveTiles, startBiomePreset, getPlayerAttackDamage);

  const scoutRevealLevel = useMemo(() => getMaxUnlockedSpawnLayer(scoutPoints), [scoutPoints]);

  const { collect } = useItemSpawn({
    conditions,
    biomeInfo: currentBiomeInfo,
    scoutRevealLevel,
    selectedSpawnLayer,
    addItem,
    markDiscovered,
    consumeTileResource: () => consumeTileResource(position.x, position.y),
  });
  useEffect(() => {
    setSelectedSpawnLayer((prev) => Math.min(prev, scoutRevealLevel));
  }, [scoutRevealLevel]);
  const { canCraft, craft, recipes } = useCrafting({ getQuantity, removeItem, addItem, markDiscovered });
  const advanceTimeBySteps = useCallback(
    (steps: number): TimeAdvanceResult => advance(steps),
    [advance]
  );

  const getLabeledAnimalName = useCallback((animal: { name: string }) => {
    const baseName = `${BIOME_LABEL_BY_PRESET[startBiomePreset]} ${animal.name}`;
    return baseName;
  }, [startBiomePreset]);

  const handleUseItem = useCallback(
    (itemId: string) => {
      if (isPlayerDead) return false;
      const item = getItemById(itemId);
      if (!item) return false;

      const tags = item.tags ?? [];
      const isPotion = tags.includes('potion');
      const isFood = tags.includes('food');
      const isEdible = isFood || tags.includes('cooking');
      const isConsumable = isPotion || isEdible;

      if (!isConsumable) {
        pushEvent('This item cannot be consumed right now.', 'warning');
        return false;
      }

      const maxRestore = maxHpRef.current;
      if (!removeItem(itemId, 1)) return false;

      const heal = isPotion
        ? POTION_HEAL
        : isEdible
          ? Math.max(1, FOOD_HEAL_BY_ITEM_ID[item.id] ?? DEFAULT_FOOD_HEAL)
          : 0;
      if (!Number.isFinite(heal) || heal <= 0) return false;

      const currentHp = playerHpRef.current;
      if (currentHp >= maxRestore) {
        pushEvent('HP is already full.', 'warning');
        return false;
      }

      const restored = Math.min(maxRestore - currentHp, heal);
      if (restored <= 0) {
        addItem(itemId, 1);
        pushEvent('HP is already full.', 'warning');
        return false;
      }

      const nextPlayerHp = currentHp + restored;
      playerHpRef.current = nextPlayerHp;
      setPlayerHp(nextPlayerHp);

      const actionVerb = isPotion ? 'drank' : 'ate';
      const kind = isPotion ? '🧪' : '🍽️';
      pushEvent(`${kind} You ${actionVerb} ${item.name}.`, 'success');
      pushEvent(`Healed ${restored} HP.`, 'success');
      return true;
    },
    [isPlayerDead, pushEvent, removeItem, addItem]
  );

  /** End-of-turn effects: advance time, move animals, apply hostile damage. */
  const postMoveEffects = useCallback(
    (newPosition: PlayerPosition, timeSteps = 1) => {
      // Advance time and resolve related effects.
      const {
        messages,
        isNewDay,
        resourceRefillCount,
        caveSpawnCount,
        skeletonSpawnCount,
      } = advanceTimeBySteps(timeSteps);
      const timeMsgs = messages;
      timeMsgs.forEach((m) => pushEvent(m, 'info'));

      if (resourceRefillCount > 0) {
        replenishTileResources();
        const dayLabel = resourceRefillCount === 1 ? 'day' : 'days';
        pushEvent(`🔄 Resources replenished after ${resourceRefillCount} ${dayLabel} cycle.`, 'success');
      }

      let nextAnimals = moveAnimals(newPosition);
      if (caveSpawnCount > 0) {
        for (let i = 0; i < caveSpawnCount; i += 1) {
          nextAnimals = spawnCaveWave();
        }
        const waveLabel = caveSpawnCount === 1 ? 'wave' : 'waves';
        pushEvent(`🐾 Cave Spawn: ${caveSpawnCount} ${waveLabel} of animals emerged.`, 'warning');
      }
      if (skeletonSpawnCount > 0) {
        for (let i = 0; i < skeletonSpawnCount; i += 1) {
          nextAnimals = spawnCaveWave(ANIMAL_TEMPLATES.skeleton);
        }
        const suffix = skeletonSpawnCount === 1 ? '' : 's';
        pushEvent(`💀 ${skeletonSpawnCount} cave skeleton wave${suffix} emerged!`, 'warning');
      }

      const adjacentHostiles = nextAnimals.filter(
        (a) =>
          a.alive &&
          a.behavior === 'hostile' &&
          Math.abs(a.position.x - newPosition.x) + Math.abs(a.position.y - newPosition.y) === 1
      );
      const totalDamage = adjacentHostiles.reduce((sum, a) => sum + Math.max(0, a.attack), 0);

      adjacentHostiles.forEach((a) => {
        const label = getLabeledAnimalName(a);
        pushEvent(`${a.emoji} ${label} attacks you for ${a.attack} damage!`, 'warning');
      });

      setPlayerHp((prevHp) => {
        let hp = prevHp;
        hp = Math.max(0, hp - totalDamage);
        if (hp <= 0) {
          if (!isPlayerDead) {
            setIsPlayerDead(true);
            if (adjacentHostiles.length > 0) {
              const causeNames = adjacentHostiles.map((a) => `${a.emoji} ${getLabeledAnimalName(a)}`).join(', ');
              setDeathCause(`Killed by ${causeNames} (${totalDamage} total damage).`);
            } else {
              setDeathCause('Killed by environmental factors.');
            }
            pushEvent('💀 You died!', 'warning');
          }
          return 0;
        }
        if (hp > maxHpRef.current) return maxHpRef.current;
        return hp;
      });
      return { isNewDay };
    },
    [advanceTimeBySteps, getLabeledAnimalName, moveAnimals, spawnCaveWave, replenishTileResources, pushEvent, isPlayerDead]
  );

  const handleCraft = useCallback(
    (recipeId: string) => {
      const msg = craft(recipeId);
      const type = msg.startsWith('✨') ? 'success' : 'warning';
      pushEvent(msg, type);
      if (type === 'success') {
        postMoveEffects(position);
      }
    },
    [craft, pushEvent, postMoveEffects, position]
  );

  const attemptCollect = useCallback(
    (times: number, lucky = false) => {
      let collectedAny = false;
      for (let i = 0; i < times; i += 1) {
        const msg = collect(lucky);
        if (!msg) continue;
        const isFound = msg.startsWith('You found');
        if (!isFound && collectedAny) {
          break;
        }
        if (isFound) {
          collectedAny = true;
          pushEvent(msg, 'success');
        } else {
          pushEvent(msg, 'warning');
          break;
        }
      }
    },
    [collect, pushEvent]
  );

  /**
   * Execute the effect of an action card, then discard it.
   * Move cards (explore/sprint) require `moveTarget`.
   */
  const handlePlayCard = useCallback(
    (card: ActionCard, moveTarget?: PlayerPosition) => {
      if (isPlayerDead) return;
      if (isPlayingCardRef.current) return;
      isPlayingCardRef.current = true;
      try {
      switch (card.type) {
        case 'forage': {
          attemptCollect(1, false);
          break;
        }
        case 'lucky_forage': {
          attemptCollect(2, true);
          break;
        }
        case 'windfall': {
          attemptCollect(3, false);
          break;
        }
        case 'explore':
        case 'sprint': {
          if (!moveTarget) return; // wait for tile selection
          const range = card.moveRange ?? 1;
          const travelDistance = getPathLength(position, moveTarget);
          if (travelDistance === -1 || travelDistance > range) {
            return;
          }
          if (getAnimalsAt(moveTarget.x, moveTarget.y).length > 0) {
            pushEvent('Cannot move onto a tile occupied by an animal.', 'warning');
            return;
          }
          const moved = moveTo(moveTarget.x, moveTarget.y);
          if (moved) {
            const biome = getBiomeInfoAt(moveTarget.x, moveTarget.y);
            const { isNewDay } = postMoveEffects(moveTarget, 1);
            pushEvent(`Moved to ${biome.emoji} ${biome.name}`, 'info');
            playCard(card.id, { preserveCard: isNewDay });
          }
          return;
        }
        case 'rest': {
          const restored = Math.ceil(maxHpRef.current * 0.5);
          const hpBefore = Math.min(playerHp, maxHpRef.current);
          const hpAfter = Math.min(maxHpRef.current, hpBefore + restored);
          pushEvent(`🛌 Rested — restored ${hpAfter - hpBefore} HP`, 'success');
          setPlayerHp(hpAfter);
          break;
        }
        case 'scout': {
          const nextScoutPoints = scoutPoints + 1;
          const nextScoutRevealLevel = getMaxUnlockedSpawnLayer(nextScoutPoints);
          setScoutPoints(nextScoutPoints);
          if (nextScoutRevealLevel > scoutRevealLevel) {
            pushEvent(`🔍 Scouting ${currentBiomeInfo.name}... layer ${nextScoutRevealLevel} unlocked!`, 'success');
            setSelectedSpawnLayer((current) => Math.min(current, nextScoutRevealLevel));
          } else {
            pushEvent(`🔍 Scouted ${currentBiomeInfo.name}. Scout points: ${nextScoutPoints}.`, 'info');
          }
          break;
        }
        case 'weather_shift': {
          const msg = shiftWeather();
          pushEvent(`🌧️ ${msg}`, 'info');
          break;
        }
        case 'summon_monster': {
          if (conditions.day < 15) {
            pushEvent('Summon Monster is unlocked after day 15.', 'warning');
            return;
          }
          if (hasUsedSummonMonster) {
            pushEvent('Summon Monster can only be used once this run.', 'warning');
            return;
          }
          const beforeCount = animals.filter((a) => a.alive).length;
          const randomHostileTemplates = Array.from({ length: 4 }, () =>
            createTemplateFromRandomHostileTemplate(startBiomePreset),
          );
          const summonedTemplates = [
            ANIMAL_TEMPLATES.bloodSkeleton,
            ...randomHostileTemplates,
          ];
          const nextAnimals = spawnCaveWaveWithTemplates(summonedTemplates);
          const spawnedCount = nextAnimals.filter((a) => a.alive).length;
          const appeared = Math.max(0, spawnedCount - beforeCount);
          if (appeared > 0) {
            pushEvent(`🩸 Summon Monster: ${appeared} monsters appeared from the cave.`, 'warning');
            if (appeared < 5) {
              pushEvent('🪦 Some summons failed to materialize because the cave was full.', 'warning');
            }
          } else {
            pushEvent('🩸 Summon Monster: the cave did not produce any monsters.', 'warning');
          }
          break;
        }
      }
      // For non-move cards: animals move and adjacent hostiles counter-attack
      const { isNewDay } = postMoveEffects(position);
      playCard(card.id, { preserveCard: isNewDay });
      } finally {
        isPlayingCardRef.current = false;
      }
    },
    [
      collect, moveTo, shiftWeather, playCard, pushEvent,
      currentBiomeInfo, postMoveEffects, position,
      getPathLength,
      getAnimalsAt,
      getBiomeInfoAt,
      conditions.day,
      scoutPoints,
      startBiomePreset,
      isPlayerDead,
      playerHp,
      animals,
      spawnCaveWaveWithTemplates,
      hasUsedSummonMonster,
    ]
  );

  /** Basic strike without a card — attacks an adjacent animal and advances the turn. */
  const handleStrike = useCallback(
    (animalId: string) => {
      if (isPlayerDead) return;
      const result = attackAnimal(animalId);
      if (!result.hit) {
        pushEvent('No adjacent animal to attack.', 'warning');
        return;
      }
      const { message, defeated, animalName, animalEmoji, animalRarity, experience } = result;
      const labeledName = animalName ? getLabeledAnimalName({ name: animalName }) : '';
      if (message) {
        const displayedMessage = animalName
          ? message
              .replace(`You defeated the ${animalName}`, `You defeated the ${labeledName}`)
              .replace(`You hit ${animalName}`, `You hit ${labeledName}`)
          : message;
        pushEvent(displayedMessage, defeated ? 'success' : 'warning');
      }
      if (defeated) {
        gainExperience(experience);
        pushEvent(`Animal defeated: ${labeledName} ${animalEmoji}`, 'success');
        setDefeatedAnimals((prev) => {
          const existing = prev.find((r) => r.name === animalName);
          if (existing) {
            return prev.map((r) => (r.name === animalName ? { ...r, count: r.count + 1 } : r));
          }
          return [...prev, { name: animalName, emoji: animalEmoji, rarity: animalRarity, count: 1 }];
        });
        addItem('raw_meat');
        addItem('animal_hide');
        markDiscovered('raw_meat');
        markDiscovered('animal_hide');
        pushEvent('🥩 Raw Meat obtained.', 'success');
        pushEvent('🪶 Animal Hide obtained.', 'success');
      }
      postMoveEffects(position);
    },
    [attackAnimal, getLabeledAnimalName, pushEvent, addItem, markDiscovered, postMoveEffects, position, isPlayerDead, gainExperience]
  );

  return {
    // World state
    conditions,
    scoutRevealLevel,
    scoutPoints,
    selectedSpawnLayer,
    setSelectedSpawnLayer,
    // Player
    playerHp,
    maxPlayerHp,
    playerLevel,
    playerXp,
    xpToNextLevel: xpNeededForNextLevel(playerLevel),
    isPlayerDead,
    // Inventory
    inventory,
    discovered,
    isDiscovered,
    events,
    recipes,
    getQuantity,
    canCraft,
    handleCraft,
    // Stats
    totalXpGained,
    defeatedAnimals,
    // Map
    position,
    mapGrid,
    currentBiomeInfo,
    visitedTiles,
    knownTiles,
    canMoveTo,
    isAdjacent,
    getTileResources,
    getReachableTiles,
    getPathLength,
    MAP_ROWS,
    MAP_COLS,
    // Animals
    animals,
    getAnimalsAt,
    getAdjacentHostile,
    getAdjacentAnimals,
    deathCause,
    // Cards
    hand,
    selectedCard,
    selectCard,
    handlePlayCard,
    handleStrike,
    handleUseItem,
    deckSize,
    // Logging
    pushEvent,
  };
}
