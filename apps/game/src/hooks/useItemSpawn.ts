// Hook that handles the "collect" action: picks a random spawnable item
// based on current conditions and adds it to inventory.

import { useCallback } from 'react';
import type { WorldConditions } from '../types/conditions';
import { ITEMS } from '../data/items';
import { getSpawnableItems, pickRandomItem } from '../utils/spawning';

interface UseItemSpawnOptions {
  conditions: WorldConditions;
  addItem: (itemId: string, qty?: number) => void;
  markDiscovered: (itemId: string) => void;
}

export function useItemSpawn({ conditions, addItem, markDiscovered }: UseItemSpawnOptions) {
  const collect = useCallback((): string => {
    const spawnable = getSpawnableItems(ITEMS, conditions);
    const item = pickRandomItem(spawnable);
    if (!item) return 'Nothing to collect right now. Try a different time or weather.';
    addItem(item.id);
    markDiscovered(item.id);
    return `You found a ${item.emoji} ${item.name}!`;
  }, [conditions, addItem, markDiscovered]);

  return { collect };
}
