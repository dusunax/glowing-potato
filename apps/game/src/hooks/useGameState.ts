// Top-level game state orchestrator. Composes all sub-hooks and wires them together.
// Components should import from here, not from sub-hooks directly.

import { useState, useCallback } from 'react';
import { useConditions } from './useConditions';
import { useInventory } from './useInventory';
import { useDiscovery } from './useDiscovery';
import { useItemSpawn } from './useItemSpawn';
import { useCrafting } from './useCrafting';
import { useMap } from './useMap';
import { useActionCards } from './useActionCards';
import { useAnimals } from './useAnimals';
import { MAP_GRID, BIOME_INFO } from '../data/map';
import type { GameEvent } from '../types/events';
import type { ActionCard } from '../types/actionCard';
import type { PlayerPosition } from '../types/map';

const INITIAL_PLAYER_HP = 10;
const MAX_PLAYER_HP = 10;

let eventCounter = 0;

export function useGameState() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [playerHp, setPlayerHp] = useState(INITIAL_PLAYER_HP);

  const pushEvent = useCallback((message: string, type: GameEvent['type'] = 'info') => {
    const ev: GameEvent = { id: String(++eventCounter), message, type, timestamp: Date.now() };
    setEvents((prev) => [ev, ...prev].slice(0, 20));
  }, []);

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
    getReachableTiles,
    MAP_ROWS,
    MAP_COLS,
  } = useMap();
  const { hand, selectedCard, selectCard, playCard, deckSize } = useActionCards();
  const { animals, moveAnimals, attackAnimal, getAnimalsAt, getAdjacentHostile, getAdjacentAnimals } = useAnimals();

  const { collect } = useItemSpawn({
    conditions,
    biomeInfo: currentBiomeInfo,
    addItem,
    markDiscovered,
    consumeTileResource: () => consumeTileResource(position.x, position.y),
  });
  const { canCraft, craft, recipes } = useCrafting({ getQuantity, removeItem, addItem, markDiscovered });

  const handleCraft = useCallback(
    (recipeId: string) => {
      const msg = craft(recipeId);
      const type = msg.startsWith('✨') ? 'success' : 'warning';
      pushEvent(msg, type);
    },
    [craft, pushEvent]
  );

  /** After player moves: move animals, then apply hostile damage if any are adjacent. */
  const postMoveEffects = useCallback(
    (newPosition: PlayerPosition) => {
      moveAnimals(newPosition);
      // Apply hostile damage after animals move
      // We use the animals state via getAdjacentHostile with newPosition
      setPlayerHp((prevHp) => {
        const adjacent = animals.filter(
          (a) =>
            a.alive &&
            a.behavior === 'hostile' &&
            Math.abs(a.position.x - newPosition.x) + Math.abs(a.position.y - newPosition.y) === 1
        );
        let hp = prevHp;
        for (const a of adjacent) {
          hp = Math.max(0, hp - a.attack);
          pushEvent(`${a.emoji} ${a.name} attacks you for ${a.attack} damage!`, 'warning');
        }
        return hp;
      });
    },
    [moveAnimals, animals, pushEvent]
  );

  /**
   * Execute the effect of an action card, then discard it.
   * Move cards (explore/sprint) require `moveTarget`.
   * Attack card requires `attackTarget` (an animal id).
   */
  const handlePlayCard = useCallback(
    (card: ActionCard, moveTarget?: PlayerPosition, attackTargetId?: string) => {
      switch (card.type) {
        case 'forage': {
          const msg = collect(false);
          pushEvent(msg, msg.startsWith('You found') ? 'success' : 'warning');
          break;
        }
        case 'lucky_forage': {
          for (let i = 0; i < 2; i++) {
            const msg = collect(true);
            pushEvent(msg, msg.startsWith('You found') ? 'success' : 'warning');
          }
          break;
        }
        case 'windfall': {
          for (let i = 0; i < 3; i++) {
            const msg = collect(false);
            pushEvent(msg, msg.startsWith('You found') ? 'success' : 'warning');
          }
          break;
        }
        case 'explore':
        case 'sprint': {
          if (!moveTarget) return; // wait for tile selection
          const moved = moveTo(moveTarget.x, moveTarget.y);
          if (moved) {
            const biome = BIOME_INFO[MAP_GRID[moveTarget.y][moveTarget.x]];
            pushEvent(`Moved to ${biome.emoji} ${biome.name}`, 'info');
            postMoveEffects(moveTarget);
          }
          break;
        }
        case 'rest': {
          const msgs = advance();
          if (msgs.length === 0) pushEvent('You rest for a while…', 'info');
          msgs.forEach((m) => pushEvent(m, 'info'));
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
        case 'attack': {
          if (!attackTargetId) return; // wait for target selection
          const msg = attackAnimal(attackTargetId);
          if (msg) pushEvent(msg, msg.includes('defeated') ? 'success' : 'warning');
          break;
        }
      }
      playCard(card.id);
    },
    [
      collect, moveTo, advance, shiftWeather, playCard, pushEvent,
      currentBiomeInfo, postMoveEffects, attackAnimal,
    ]
  );

  return {
    // World state
    conditions,
    // Player
    playerHp,
    maxPlayerHp: MAX_PLAYER_HP,
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
    deckSize,
  };
}
