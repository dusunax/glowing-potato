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
import { MAP_GRID, BIOME_INFO } from '../data/map';
import type { GameEvent } from '../types/events';
import type { ActionCard } from '../types/actionCard';
import type { PlayerPosition } from '../types/map';

let eventCounter = 0;

export function useGameState() {
  const [events, setEvents] = useState<GameEvent[]>([]);

  const pushEvent = useCallback((message: string, type: GameEvent['type'] = 'info') => {
    const ev: GameEvent = { id: String(++eventCounter), message, type, timestamp: Date.now() };
    setEvents((prev) => [ev, ...prev].slice(0, 20));
  }, []);

  const { conditions, advance, shiftWeather } = useConditions();
  const { inventory, addItem, removeItem, getQuantity } = useInventory();
  const { discovered, markDiscovered, isDiscovered } = useDiscovery();
  const { position, currentBiomeInfo, canMoveTo, moveTo, MAP_ROWS, MAP_COLS } = useMap();
  const { hand, selectedCard, selectCard, playCard, deckSize } = useActionCards();

  const { collect } = useItemSpawn({
    conditions,
    biomeInfo: currentBiomeInfo,
    addItem,
    markDiscovered,
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

  /**
   * Execute the effect of an action card, then discard it.
   * Move cards (explore/sprint) require `moveTarget`.
   */
  const handlePlayCard = useCallback(
    (card: ActionCard, moveTarget?: PlayerPosition) => {
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
      }
      playCard(card.id);
    },
    [collect, moveTo, advance, shiftWeather, playCard, pushEvent, currentBiomeInfo]
  );

  return {
    // World state
    conditions,
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
    canMoveTo,
    MAP_ROWS,
    MAP_COLS,
    // Cards
    hand,
    selectedCard,
    selectCard,
    handlePlayCard,
    deckSize,
  };
}
