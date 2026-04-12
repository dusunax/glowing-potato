// Hook that handles the "collect" action: picks a random spawnable item
// based on current conditions, biome, and luck, then adds it to inventory.

import { useCallback } from 'react';
import type { WorldConditions } from '../types/conditions';
import type { BiomeInfo } from '../types/map';
import { ITEMS } from '../data/items';
import {
  getSpawnableItemsByLayer,
  getSpawnableItemsUpToLayer,
  pickRandomItemWithBiome,
  pickRandomItemLucky,
} from '../utils/spawning';

interface UseItemSpawnOptions {
  conditions: WorldConditions;
  biomeInfo: BiomeInfo;
  scoutRevealLevel: number;
  selectedSpawnLayer: number;
  unlockedSpawnLayerItemCounts: Record<number, number>;
  addItem: (itemId: string, qty?: number) => void;
  markDiscovered: (itemId: string) => void;
  /** Returns remaining resources on the current tile; pass -1 to indicate depleted already */
  consumeTileResource: () => number;
}

export function useItemSpawn({
  conditions,
  biomeInfo,
  scoutRevealLevel,
  selectedSpawnLayer,
  unlockedSpawnLayerItemCounts,
  addItem,
  markDiscovered,
  consumeTileResource,
}: UseItemSpawnOptions) {
  const collect = useCallback(
    (lucky = false): string => {
      // Consume one resource from the tile; -1 means already depleted
      const remaining = consumeTileResource();
      if (remaining < 0) {
        return '';
      }
      const effectiveRevealLevel = Math.min(scoutRevealLevel, selectedSpawnLayer);
      const spawnable = selectedSpawnLayer <= scoutRevealLevel
        ? getSpawnableItemsByLayer(ITEMS, conditions, scoutRevealLevel, selectedSpawnLayer, biomeInfo.type)
        : getSpawnableItemsUpToLayer(ITEMS, conditions, scoutRevealLevel, biomeInfo.type);
      if (spawnable.length === 0) {
        return 'Nothing to collect right now. Try a different time or weather.';
      }

      const unlockedCount = selectedSpawnLayer === 1
        ? spawnable.length
        : Math.min(
            spawnable.length,
            Math.max(0, unlockedSpawnLayerItemCounts[selectedSpawnLayer] ?? 0),
          );

      if (selectedSpawnLayer > 1 && unlockedCount <= 0) {
        return `No unlocked spawnable items at Lv.${selectedSpawnLayer} yet. Use scout points to unlock one first.`;
      }

      const visibleSpawnable = unlockedCount < spawnable.length
        ? spawnable.slice(0, unlockedCount)
        : spawnable;

      const item = lucky
        ? pickRandomItemLucky(visibleSpawnable, biomeInfo, effectiveRevealLevel)
        : pickRandomItemWithBiome(visibleSpawnable, biomeInfo, effectiveRevealLevel);

      if (!item) return 'Nothing to collect right now. Try a different time or weather.';
      addItem(item.id);
      markDiscovered(item.id);
      return `You found a ${item.emoji} ${item.name}!`;
    },
    [biomeInfo, conditions, markDiscovered, scoutRevealLevel, selectedSpawnLayer, consumeTileResource, addItem, unlockedSpawnLayerItemCounts]
  );

  return { collect };
}
