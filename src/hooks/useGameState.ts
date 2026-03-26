// Top-level game state orchestrator. Composes all sub-hooks and wires them together.
// Components should import from here, not from sub-hooks directly.

import { useState, useCallback } from 'react';
import { useConditions } from './useConditions';
import { useInventory } from './useInventory';
import { useDiscovery } from './useDiscovery';
import { useItemSpawn } from './useItemSpawn';
import { useCrafting } from './useCrafting';
import type { GameEvent } from '../types/events';

let eventCounter = 0;

export function useGameState() {
  const [events, setEvents] = useState<GameEvent[]>([]);

  const pushEvent = useCallback((message: string, type: GameEvent['type'] = 'info') => {
    const ev: GameEvent = { id: String(++eventCounter), message, type, timestamp: Date.now() };
    setEvents((prev) => [ev, ...prev].slice(0, 10));
  }, []);

  const { conditions, advance } = useConditions();
  const { inventory, addItem, removeItem, getQuantity } = useInventory();
  const { discovered, markDiscovered, isDiscovered } = useDiscovery();
  const { collect } = useItemSpawn({ conditions, addItem, markDiscovered });
  const { canCraft, craft, recipes } = useCrafting({ getQuantity, removeItem, addItem, markDiscovered });

  const handleCollect = useCallback(() => {
    const msg = collect();
    const type = msg.startsWith('You found') ? 'success' : 'warning';
    pushEvent(msg, type);
  }, [collect, pushEvent]);

  const handleAdvanceTime = useCallback(() => {
    const msgs = advance();
    msgs.forEach((m) => pushEvent(m, 'info'));
  }, [advance, pushEvent]);

  const handleCraft = useCallback(
    (recipeId: string) => {
      const msg = craft(recipeId);
      const type = msg.startsWith('✨') ? 'success' : 'warning';
      pushEvent(msg, type);
    },
    [craft, pushEvent]
  );

  return {
    conditions,
    inventory,
    discovered,
    isDiscovered,
    events,
    recipes,
    getQuantity,
    canCraft,
    handleCollect,
    handleAdvanceTime,
    handleCraft,
  };
}
