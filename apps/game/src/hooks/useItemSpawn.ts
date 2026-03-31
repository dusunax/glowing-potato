// Hook that handles the "collect" action: picks a random spawnable item
// based on current conditions, biome, and luck, then adds it to inventory.

import { useCallback } from 'react';
import type { WorldConditions } from '../types/conditions';
import type { BiomeInfo } from '../types/map';
import { ITEMS } from '../data/items';
import { getSpawnableItems, pickRandomItemWithBiome, pickRandomItemLucky } from '../utils/spawning';

interface UseItemSpawnOptions {
  conditions: WorldConditions;
  biomeInfo: BiomeInfo;
  addItem: (itemId: string, qty?: number) => void;
  markDiscovered: (itemId: string) => void;
}

export function useItemSpawn({ conditions, biomeInfo, addItem, markDiscovered }: UseItemSpawnOptions) {
  const collect = useCallback(
    (lucky = false): string => {
      const spawnable = getSpawnableItems(ITEMS, conditions);
      const item = lucky
        ? pickRandomItemLucky(spawnable, biomeInfo)
        : pickRandomItemWithBiome(spawnable, biomeInfo);
      if (!item) return 'Nothing to collect right now. Try a different time or weather.';
      addItem(item.id);
      markDiscovered(item.id);
      return `You found a ${item.emoji} ${item.name}!`;
    },
    [conditions, biomeInfo, addItem, markDiscovered]
  );

  return { collect };
}
