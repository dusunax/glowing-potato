// Top-level game state orchestrator. Composes all sub-hooks and wires them together.
// Components should import from here, not from sub-hooks directly.

import { useState, useCallback, useRef } from 'react';
import { useConditions, type TimeAdvanceResult } from './useConditions';
import { useInventory } from './useInventory';
import { useDiscovery } from './useDiscovery';
import { useItemSpawn } from './useItemSpawn';
import { useCrafting } from './useCrafting';
import { useMap } from './useMap';
import { useActionCards } from './useActionCards';
import { useAnimals } from './useAnimals';
import { MAP_GRID, BIOME_INFO } from '../data/map';
import { getItemById } from '../data/items';
import type { GameEvent } from '../types/events';
import type { ActionCard } from '../types/actionCard';
import type { PlayerPosition } from '../types/map';

const BASE_PLAYER_HP = 10;
const XP_BASE_TO_NEXT_LEVEL = 12;
const XP_LEVEL_GROWTH = 2;
const HP_INCREASE_PER_LEVEL = 2;
const FOOD_HEAL = 4;
const POTION_HEAL = 8;

let eventCounter = 0;

export function useGameState() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [playerHp, setPlayerHp] = useState(BASE_PLAYER_HP);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXp, setPlayerXp] = useState(0);
  const [maxPlayerHp, setMaxPlayerHp] = useState(BASE_PLAYER_HP);
  const [isPlayerDead, setIsPlayerDead] = useState(false);
  const maxHpRef = useRef(BASE_PLAYER_HP);

  const pushEvent = useCallback((message: string, type: GameEvent['type'] = 'info') => {
    const ev: GameEvent = { id: String(++eventCounter), message, type, timestamp: Date.now() };
    setEvents((prev) => [...prev, ev].slice(-20));
  }, []);

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

      if (levelUps > 0) {
        setPlayerHp(nextMaxHp);
      }
    },
    [isPlayerDead, maxHpRef, maxPlayerHp, playerLevel, playerXp, xpNeededForNextLevel, pushEvent]
  );

  const { conditions, advance, shiftWeather } = useConditions();
  const { inventory, addItem, removeItem, getQuantity } = useInventory();
  const { discovered, markDiscovered, isDiscovered } = useDiscovery();
  const {
    position,
    currentBiomeInfo,
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
  } = useMap();
  const { hand, selectedCard, selectCard, playCard, deckSize } = useActionCards();
  const {
    animals,
    moveAnimals,
    spawnCaveWave,
    attackAnimal,
    getAnimalsAt,
    getAdjacentHostile,
    getAdjacentAnimals,
  } = useAnimals();

  const { collect } = useItemSpawn({
    conditions,
    biomeInfo: currentBiomeInfo,
    addItem,
    markDiscovered,
    consumeTileResource: () => consumeTileResource(position.x, position.y),
  });
  const { canCraft, craft, recipes } = useCrafting({ getQuantity, removeItem, addItem, markDiscovered });
  const advanceTimeBySteps = useCallback(
    (steps: number): TimeAdvanceResult => advance(steps),
    [advance]
  );

  const handleCraft = useCallback(
    (recipeId: string) => {
      const msg = craft(recipeId);
      const type = msg.startsWith('✨') ? 'success' : 'warning';
      pushEvent(msg, type);
    },
    [craft, pushEvent]
  );

  const handleUseItem = useCallback(
    (itemId: string) => {
      if (isPlayerDead) return false;
      const item = getItemById(itemId);
      if (!item) return false;

      const tags = item.tags ?? [];
      const isPotion = tags.includes('potion');
      const isCookedFood = tags.includes('cooking');
      const isConsumable = isPotion || isCookedFood;

      if (!isConsumable) {
        pushEvent('This item cannot be consumed right now.', 'warning');
        return false;
      }

      const maxRestore = maxHpRef.current;
      if (playerHp >= maxRestore) {
        pushEvent('HP is already full.', 'warning');
        return false;
      }

      if (!removeItem(itemId, 1)) return false;

      const heal = isPotion ? POTION_HEAL : FOOD_HEAL;
      const nextHp = Math.min(maxRestore, playerHp + heal);
      const restored = nextHp - playerHp;
      setPlayerHp(nextHp);

      const actionVerb = isPotion ? 'drank' : 'ate';
      const kind = isPotion ? '🧪' : '🍽️';
      pushEvent(`${kind} You ${actionVerb} ${item.name}.`, 'success');
      pushEvent(`Healed ${restored} HP.`, 'success');
      return true;
    },
    [isPlayerDead, playerHp, pushEvent, removeItem]
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
        pushEvent(`🐾 ${caveSpawnCount} cave ${waveLabel} of animals emerged.`, 'warning');
      }

      const seenHostiles = new Set<string>();
      setPlayerHp((prevHp) => {
        const adjacent = nextAnimals.filter(
          (a) =>
            a.alive &&
            a.behavior === 'hostile' &&
            Math.abs(a.position.x - newPosition.x) + Math.abs(a.position.y - newPosition.y) === 1 &&
            !seenHostiles.has(a.id) &&
            !!(seenHostiles.add(a.id))
        );
        let hp = prevHp;
        for (const a of adjacent) {
          hp = Math.max(0, hp - a.attack);
          pushEvent(`${a.emoji} ${a.name} attacks you for ${a.attack} damage!`, 'warning');
        }
        if (hp <= 0) {
          if (!isPlayerDead) {
            setIsPlayerDead(true);
            pushEvent('💀 You died!', 'warning');
          }
          return 0;
        }
        if (hp > maxHpRef.current) return maxHpRef.current;
        return hp;
      });
      return { isNewDay };
    },
    [advanceTimeBySteps, moveAnimals, spawnCaveWave, replenishTileResources, pushEvent, isPlayerDead]
  );

  /**
   * Execute the effect of an action card, then discard it.
   * Move cards (explore/sprint) require `moveTarget`.
   */
  const handlePlayCard = useCallback(
    (card: ActionCard, moveTarget?: PlayerPosition) => {
      if (isPlayerDead) return;
      switch (card.type) {
        case 'forage': {
          const msg = collect(false);
          if (msg) pushEvent(msg, msg.startsWith('You found') ? 'success' : 'warning');
          break;
        }
        case 'lucky_forage': {
          for (let i = 0; i < 2; i++) {
            const msg = collect(true);
            if (msg) pushEvent(msg, msg.startsWith('You found') ? 'success' : 'warning');
          }
          break;
        }
        case 'windfall': {
          for (let i = 0; i < 3; i++) {
            const msg = collect(false);
            if (msg) pushEvent(msg, msg.startsWith('You found') ? 'success' : 'warning');
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
            const biome = BIOME_INFO[MAP_GRID[moveTarget.y][moveTarget.x]];
            const { isNewDay } = postMoveEffects(moveTarget, 1);
            pushEvent(`Moved to ${biome.emoji} ${biome.name}`, 'info');
            playCard(card.id, { preserveCard: isNewDay });
          }
          return;
        }
        case 'rest': {
          setPlayerHp((prev) => {
            const restored = Math.ceil(maxHpRef.current * 0.5);
            const next = Math.min(maxHpRef.current, prev + restored);
            pushEvent(`🛌 Rested — restored ${next - prev} HP`, 'success');
            return next;
          });
          break;
        }
        case 'scout': {
          pushEvent(`🔍 Scouting ${currentBiomeInfo.name}… check the Spawnable tab!`, 'info');
          break;
        }
        case 'weather_shift': {
          const msg = shiftWeather();
          pushEvent(`🌧️ ${msg}`, 'info');
          break;
        }
      }
      // For non-move cards: animals move and adjacent hostiles counter-attack
      const { isNewDay } = postMoveEffects(position);
      playCard(card.id, { preserveCard: isNewDay });
    },
    [
      collect, moveTo, shiftWeather, playCard, pushEvent,
      currentBiomeInfo, postMoveEffects, position,
      getPathLength,
      getAnimalsAt,
      isPlayerDead
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
      const { message, defeated, animalName, animalEmoji, experience } = result;
      if (message) pushEvent(message, defeated ? 'success' : 'warning');
      if (defeated) {
        gainExperience(experience);
        pushEvent(`Animal defeated: ${animalName} ${animalEmoji}`, 'success');
        addItem('raw_meat');
        addItem('animal_hide');
        markDiscovered('raw_meat');
        markDiscovered('animal_hide');
        pushEvent('🥩 Raw Meat obtained.', 'success');
        pushEvent('🪶 Animal Hide obtained.', 'success');
      }
      postMoveEffects(position);
    },
    [attackAnimal, pushEvent, addItem, markDiscovered, postMoveEffects, position, isPlayerDead, gainExperience]
  );

  return {
    // World state
    conditions,
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
    // Map
    position,
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
    // Cards
    hand,
    selectedCard,
    selectCard,
    handlePlayCard,
    handleStrike,
    handleUseItem,
    deckSize,
  };
}
