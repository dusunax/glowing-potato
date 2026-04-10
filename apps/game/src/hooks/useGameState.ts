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
import { getItemById, ITEMS } from '../data/items';
import { ANIMAL_TEMPLATES, createTemplateFromRandomHostileTemplate } from '../data/animals';
import {
  getMaxUnlockedSpawnLayer,
  SPAWN_LAYER_UNLOCK_COST_BY_LEVEL,
  MAX_SPAWN_REVEAL_LEVEL,
  getSpawnableItemsByLayerCatalog,
} from '../utils/spawning';
import type { GameEvent } from '../types/events';
import type { ActionCard } from '../types/actionCard';
import type { PlayerPosition, MapBiomePreset } from '../types/map';
import type { AnimalRecord } from '../types/score';

const BASE_PLAYER_HP = 10;
const XP_BASE_TO_NEXT_LEVEL = 12;
const XP_LEVEL_GROWTH = 2;
const HP_INCREASE_PER_LEVEL = 2;
const TREASURE_XP_MIN = 8;
const TREASURE_XP_MAX = 18;
type TreasureRewardType = 'xp' | 'weapon' | 'gold_chunk';
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
  const actionTurnRef = useRef<number | null>(null);
  const actionSequenceRef = useRef(0);
  const [playerHp, setPlayerHp] = useState(BASE_PLAYER_HP);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXp, setPlayerXp] = useState(0);
  const [maxPlayerHp, setMaxPlayerHp] = useState(BASE_PLAYER_HP);
  const [isPlayerDead, setIsPlayerDead] = useState(false);
  const [deathCause, setDeathCause] = useState('');
  const [scoutPoints, setScoutPoints] = useState(0);
  const [scoutUnlockLevel, setScoutUnlockLevel] = useState(1);
  const [selectedSpawnLayer, setSelectedSpawnLayer] = useState(1);
  const [spawnLayerUnlockedItemCounts, setSpawnLayerUnlockedItemCounts] = useState<Record<number, number>>({});
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const maxHpRef = useRef(BASE_PLAYER_HP);
  const playerHpRef = useRef(BASE_PLAYER_HP);
  const [totalXpGained, setTotalXpGained] = useState(0);
  const [defeatedAnimals, setDefeatedAnimals] = useState<AnimalRecord[]>([]);
  const [hasUsedSummonMonster, setHasUsedSummonMonster] = useState(false);
  const isPlayingCardRef = useRef(false);
  const damageFlashTimerRef = useRef<number | NodeJS.Timeout | null>(null);

  const pushEvent = useCallback((message: string, type: GameEvent['type'] = 'info', turn?: number) => {
    const timestamp = Date.now();
    const nextId = ++eventSequenceRef.current;
    const eventTurn = turn ?? actionTurnRef.current ?? undefined;
    const ev: GameEvent = {
      id: `${timestamp}-${nextId}`,
      message,
      type,
      timestamp,
      turn: eventTurn,
    };
    setEvents((prev) => [...prev, ev]);
  }, []);
  const withActionTurn = useCallback((handler: (turn: number) => void) => {
    const turn = ++actionSequenceRef.current;
    actionTurnRef.current = turn;
    try {
      handler(turn);
    } finally {
      actionTurnRef.current = null;
    }
  }, []);

  const triggerDamageFlash = useCallback(() => {
    setShowDamageFlash(true);
    if (damageFlashTimerRef.current) {
      window.clearTimeout(damageFlashTimerRef.current);
    }
    damageFlashTimerRef.current = window.setTimeout(() => {
      setShowDamageFlash(false);
      damageFlashTimerRef.current = null;
    }, 450);
  }, []);

  useEffect(() => {
    return () => {
      if (damageFlashTimerRef.current) {
        window.clearTimeout(damageFlashTimerRef.current);
      }
    };
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
    depleteTileResource,
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
    onDeckRefill: (deckType) => {
      const deckLabel = deckType === 'move' ? 'Move' : deckType === 'forage' ? 'Forage' : 'Skill';
      pushEvent(`🔁 ${deckLabel} deck was reshuffled and refilled.`, 'info');
    },
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

  const scoutRevealLevel = useMemo(() => {
    const pointReveal = getMaxUnlockedSpawnLayer(scoutPoints);
    return Math.max(scoutUnlockLevel, pointReveal);
  }, [scoutPoints, scoutUnlockLevel]);

  const getSpawnLayerItemCount = useCallback(
    (level: number) =>
      getSpawnableItemsByLayerCatalog(
        ITEMS,
        scoutRevealLevel,
        level,
        currentBiomeInfo.type,
      ).length,
    [scoutRevealLevel, currentBiomeInfo.type]
  );

  const normalizeLayer = useCallback((level: number) => {
    return Math.max(1, Math.min(Math.floor(level), MAX_SPAWN_REVEAL_LEVEL));
  }, []);

  useEffect(() => {
    const foundationLevel = 1;
    const foundationCount = getSpawnLayerItemCount(foundationLevel);
    setSpawnLayerUnlockedItemCounts((prev) => {
      if (prev[foundationLevel] === foundationCount) {
        return prev;
      }
      return {
        ...prev,
        [foundationLevel]: foundationCount,
      };
    });
  }, [getSpawnLayerItemCount]);

  const { collect } = useItemSpawn({
    conditions,
    biomeInfo: currentBiomeInfo,
    scoutRevealLevel,
    selectedSpawnLayer,
    unlockedSpawnLayerItemCounts: spawnLayerUnlockedItemCounts,
    addItem,
    markDiscovered,
    consumeTileResource: () => consumeTileResource(position.x, position.y),
  });
  useEffect(() => {
    setSelectedSpawnLayer((prev) => Math.min(prev, scoutRevealLevel));
  }, [scoutRevealLevel]);
  const { canCraft, craft, recipes } = useCrafting({ getQuantity, removeItem, addItem, markDiscovered });

  const unlockSpawnLayer = useCallback(
    (targetLevel: number) => {
      if (!Number.isFinite(targetLevel)) return;
      const normalizedLevel = Math.max(1, Math.min(Math.floor(targetLevel), MAX_SPAWN_REVEAL_LEVEL));
      const currentMax = Math.max(scoutRevealLevel, 1);
      if (normalizedLevel <= currentMax) {
        pushEvent(`Spawn layer Lv.${normalizedLevel} is already unlocked.`, 'info');
        return;
      }
      if (normalizedLevel > currentMax + 1) {
        pushEvent(`Unlock Lv.${currentMax} first to proceed.`, 'warning');
        return;
      }

      const currentCost = SPAWN_LAYER_UNLOCK_COST_BY_LEVEL[currentMax] ?? 0;
      const nextCost = SPAWN_LAYER_UNLOCK_COST_BY_LEVEL[normalizedLevel] ?? currentCost;
      const needed = nextCost - currentCost;
      if (needed <= 0) return;
      if (scoutPoints < needed) {
        pushEvent(`Need ${needed} scout points to unlock Lv.${normalizedLevel}.`, 'warning');
        return;
      }

      setScoutPoints((prev) => prev - needed);
      setScoutUnlockLevel((prev) => Math.max(prev, normalizedLevel));
      setSelectedSpawnLayer(normalizedLevel);
      setSpawnLayerUnlockedItemCounts((prev) => {
        if (prev[normalizedLevel] !== undefined) {
          return prev;
        }
        return {
          ...prev,
          [normalizedLevel]: 0,
        };
      });
      pushEvent(`🗝️ Spawnable layer Lv.${normalizedLevel} unlocked.`, 'success');
    },
    [scoutPoints, scoutRevealLevel, setSelectedSpawnLayer, pushEvent]
  );

  const unlockNextSpawnItemAtLayer = useCallback(
    (targetLevel: number) => {
      const normalizedLevel = normalizeLayer(targetLevel);
      if (normalizedLevel <= scoutRevealLevel) {
        const availableCount = getSpawnLayerItemCount(normalizedLevel);
        if (availableCount === 0) {
          pushEvent(`No items available at Lv.${normalizedLevel} yet.`, 'warning');
          return;
        }
        const currentUnlocked = Math.max(0, spawnLayerUnlockedItemCounts[normalizedLevel] ?? 0);
        if (currentUnlocked >= availableCount) {
          pushEvent(`Lv.${normalizedLevel} is fully unlocked.`, 'info');
          return;
        }
        if (scoutPoints < 1) {
          pushEvent(`Need 1 scout point to unlock next item at Lv.${normalizedLevel}.`, 'warning');
          return;
        }

        const allLayerItems = getSpawnableItemsByLayerCatalog(
          ITEMS,
          scoutRevealLevel,
          normalizedLevel,
          currentBiomeInfo.type,
        );
        const sortedLayerItems = allLayerItems.slice().sort((a, b) => {
          if (a.rarity !== b.rarity) return a.rarity - b.rarity;
          return a.name.localeCompare(b.name);
        });
        const targetItem = sortedLayerItems[currentUnlocked];

        setScoutPoints((prev) => prev - 1);
        setSpawnLayerUnlockedItemCounts((prev) => {
          const current = Math.max(0, prev[normalizedLevel] ?? 0);
          const next = Math.min(availableCount, current + 1);
          if (next === current) {
            return prev;
          }
          return {
            ...prev,
            [normalizedLevel]: next,
          };
        });
        if (targetItem) {
          pushEvent(`🔐 Lv.${normalizedLevel} unlocked: ${targetItem.name}.`, 'success');
        } else {
          pushEvent(`Lv.${normalizedLevel} unlocked one more item.`, 'success');
        }
        return;
      }

      pushEvent(`Unlock Lv.${normalizedLevel} first to unlock its items.`, 'warning');
    },
    [
      currentBiomeInfo.type,
      getSpawnLayerItemCount,
      normalizeLayer,
      scoutPoints,
      scoutRevealLevel,
      pushEvent,
      spawnLayerUnlockedItemCounts,
    ]
  );
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
      const gainedXp = item.xpGain ?? 0;
      const isXpConsumable = gainedXp > 0;
      const isConsumable = isPotion || isEdible || isXpConsumable;

      if (!isConsumable) {
        pushEvent('This item cannot be consumed right now.', 'warning');
        return false;
      }

      const maxRestore = maxPlayerHp;
      const heal = isPotion || isEdible ? Math.max(0, item.healingAmount ?? 0) : 0;
      const canHeal = heal > 0;

      if (!canHeal && !isXpConsumable) {
        pushEvent('This item has no effect to consume.', 'warning');
        return false;
      }
      if (canHeal) {
        if (playerHp >= maxRestore) {
          pushEvent('HP is already full.', 'warning');
          return false;
        }
      }

      if (!removeItem(itemId, 1)) return false;

      let appliedHp = 0;
      let nextPlayerHp = 0;
      setPlayerHp((prevHp) => {
        const prev = Math.min(prevHp, maxRestore);
        const next = Math.min(maxRestore, prev + heal);
        appliedHp = next - prev;
        nextPlayerHp = next;
        return next;
      });

      if (isXpConsumable) {
        gainExperience(gainedXp);
      }

      const actionVerb = isPotion ? 'drank' : 'ate';
      const kind = isPotion ? '🧪' : '🍽️';
      const hpBefore = Math.max(0, nextPlayerHp - appliedHp);
      if (isPotion || isFood) {
        pushEvent(`[ITEM][USE] ${kind} You ${actionVerb} ${item.name}.`, 'success');
        pushEvent(`[ITEM][USE] HP ${hpBefore}/${maxRestore} → ${nextPlayerHp}/${maxRestore} (+${appliedHp} HP).`, 'success');
      } else {
        pushEvent(`[ITEM][USE] ${kind} You used ${item.name}.`, 'success');
      }

      if (isXpConsumable) {
        pushEvent(`[ITEM][XP] Gained ${gainedXp} XP from ${item.name}.`, 'success');
      }
      return true;
    },
    [gainExperience, isPlayerDead, maxPlayerHp, playerHp, pushEvent, removeItem]
  );

  const grantTreasureReward = useCallback(
    (rewardType: TreasureRewardType) => {
      if (isPlayerDead) return;
      depleteTileResource(position.x, position.y);

      if (rewardType === 'xp') {
        const gainedXp = TREASURE_XP_MIN + Math.floor(Math.random() * (TREASURE_XP_MAX - TREASURE_XP_MIN + 1));
        gainExperience(gainedXp);
        pushEvent(`🗝️ Treasure reward: gained ${gainedXp} XP.`, 'success');
        return;
      }

      if (rewardType === 'gold_chunk') {
        const goldChunk = getItemById('gold_chunk');
        if (!goldChunk) return;
        addItem('gold_chunk');
        markDiscovered('gold_chunk');
        pushEvent(`🗝️ Treasure reward: discovered ${goldChunk.name}.`, 'success');
        return;
      }

      const pickedWeapon = getItemById('iron_knife');
      if (!pickedWeapon) return;
      addItem(pickedWeapon.id);
      markDiscovered(pickedWeapon.id);
      pushEvent(`🗝️ Treasure reward: found ${pickedWeapon.name}.`, 'success');
    },
    [addItem, depleteTileResource, gainExperience, isPlayerDead, markDiscovered, pushEvent, position.x, position.y],
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

      moveAnimals(newPosition);
      const adjacentHostilesBeforeSpawn = getAdjacentHostile(newPosition);

      if (caveSpawnCount > 0) {
        for (let i = 0; i < caveSpawnCount; i += 1) {
          spawnCaveWave(undefined, newPosition);
        }
        const waveLabel = caveSpawnCount === 1 ? 'wave' : 'waves';
        pushEvent(`❗️ Cave Spawn: ${caveSpawnCount} ${waveLabel} of animals emerged.`, 'warning');
      }
      if (skeletonSpawnCount > 0) {
        for (let i = 0; i < skeletonSpawnCount; i += 1) {
          spawnCaveWave(ANIMAL_TEMPLATES.skeleton, newPosition);
        }
        const suffix = skeletonSpawnCount === 1 ? '' : 's';
        pushEvent(`💀 ${skeletonSpawnCount} cave skeleton wave${suffix} emerged!`, 'warning');
      }

      const uniqueAdjacentHostiles = Array.from(
        new Map(adjacentHostilesBeforeSpawn.map((animal) => [animal.id, animal])).values(),
      );
      const totalDamage = uniqueAdjacentHostiles.reduce((sum, a) => sum + Math.max(0, a.attack), 0);
      if (totalDamage > 0) {
        triggerDamageFlash();
      }

      uniqueAdjacentHostiles.forEach((a) => {
        const label = getLabeledAnimalName(a);
        pushEvent(`${a.emoji} ${label} attacks you for ${a.attack} damage!`, 'warning');
      });

      setPlayerHp((prevHp) => {
        if (totalDamage <= 0) return prevHp;
        const hpBefore = prevHp;
        const hp = Math.max(0, hpBefore - totalDamage);
        pushEvent(`You received ${totalDamage} damage. HP ${hpBefore} -> ${hp}.`, 'warning');
        if (hp <= 0) {
          if (!isPlayerDead) {
            setIsPlayerDead(true);
            if (uniqueAdjacentHostiles.length > 0) {
              const causeNames = uniqueAdjacentHostiles.map((a) => `${a.emoji} ${getLabeledAnimalName(a)}`).join(', ');
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
    [
      advanceTimeBySteps,
      getAdjacentHostile,
      getLabeledAnimalName,
      moveAnimals,
      spawnCaveWave,
      replenishTileResources,
      pushEvent,
      isPlayerDead,
      triggerDamageFlash,
    ]
  );

  const handleCraft = useCallback(
    (recipeId: string) => {
    withActionTurn(() => {
        const msg = craft(recipeId);
        const itemMsg = msg.startsWith('✨') ? `[ITEM][CRAFT] Crafted: ${msg.replace('✨ Crafted: ', '')}` : `[ITEM][CRAFT] ${msg}`;
        const type = msg.startsWith('✨') ? 'success' : 'warning';
      pushEvent(itemMsg, type);
      if (type === 'success') {
        postMoveEffects(position);
      }
    });
    },
    [craft, pushEvent, postMoveEffects, position, withActionTurn]
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
    (card: ActionCard, moveTarget?: PlayerPosition, options?: { skipTreasureCollect?: boolean }) => {
      if (isPlayerDead) return;
      if (isPlayingCardRef.current) return;
      isPlayingCardRef.current = true;
      const shouldSkipCollectFromTreasure = options?.skipTreasureCollect === true;
      withActionTurn(() => {
        try {
          switch (card.type) {
            case 'forage': {
              if (!shouldSkipCollectFromTreasure) {
                attemptCollect(1, false);
              }
              break;
            }
            case 'lucky_forage': {
              if (!shouldSkipCollectFromTreasure) {
                attemptCollect(2, true);
              }
              break;
            }
            case 'windfall': {
              if (!shouldSkipCollectFromTreasure) {
                attemptCollect(3, false);
              }
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
              pushEvent(`🛌 You rested. HP ${hpBefore} → ${hpAfter} (+${hpAfter - hpBefore} HP).`, 'success');
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
              const nextAnimals = spawnCaveWaveWithTemplates(summonedTemplates, position);
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
      });
    },
    [
      attemptCollect,
      getBiomeInfoAt,
      getMaxUnlockedSpawnLayer,
      getPathLength,
      getAnimalsAt,
      moveTo,
      isPlayerDead,
      playerHp,
      pushEvent,
      conditions.day,
      currentBiomeInfo,
      hasUsedSummonMonster,
      postMoveEffects,
      playCard,
      setSelectedSpawnLayer,
      setScoutPoints,
      scoutPoints,
      startBiomePreset,
      shiftWeather,
      spawnCaveWaveWithTemplates,
      animals,
      isPlayingCardRef,
      withActionTurn,
    ]
  );

  /** Basic strike without a card — attacks an adjacent animal and advances the turn. */
  const handleStrike = useCallback(
    (animalId: string) => {
      if (isPlayerDead) return;
      withActionTurn(() => {
        const result = attackAnimal(animalId, position);
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
          const isSkeleton = animalName === 'Skeleton' || animalName === 'Blood Skeleton';
          if (isSkeleton) {
            addItem('bone', 2);
            markDiscovered('bone');
            pushEvent('🦴 Bones obtained.', 'success');
          }
          pushEvent('🥩 Raw Meat obtained.', 'success');
          pushEvent('🪶 Animal Hide obtained.', 'success');
        }
        postMoveEffects(position);
      });
    },
    [attackAnimal, getLabeledAnimalName, pushEvent, addItem, markDiscovered, postMoveEffects, position, isPlayerDead, gainExperience, withActionTurn]
  );

  return {
    // World state
    conditions,
    scoutRevealLevel,
    scoutPoints,
    scoutUnlockLevel,
    selectedSpawnLayer,
    unlockSpawnLayer,
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
    depleteTileResource,
    grantTreasureReward,
    deckSize,
    // Logging
    pushEvent,
    showDamageFlash,
    spawnLayerUnlockedItemCounts,
    unlockNextSpawnItemAtLayer,
  };
}
