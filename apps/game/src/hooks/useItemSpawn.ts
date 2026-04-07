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
      const spawnable = selectedSpawnLayer <= scoutRevealLevel
        ? getSpawnableItemsByLayer(ITEMS, conditions, scoutRevealLevel, selectedSpawnLayer, biomeInfo.type)
        : getSpawnableItemsUpToLayer(ITEMS, conditions, scoutRevealLevel, biomeInfo.type);
      const item = lucky
        ? pickRandomItemLucky(spawnable, biomeInfo)
        : pickRandomItemWithBiome(spawnable, biomeInfo);
      if (!item) return 'Nothing to collect right now. Try a different time or weather.';
      addItem(item.id);
      markDiscovered(item.id);
      const depletedNote = remaining === 0 ? ' (tile now exhausted)' : '';
      return `You found a ${item.emoji} ${item.name}!${depletedNote}`;
    },
    [biomeInfo, conditions, markDiscovered, scoutRevealLevel, selectedSpawnLayer, consumeTileResource, addItem]
  );

  return { collect };
}
