// Hook that handles the "collect" action: picks a random spawnable item
// based on current conditions, biome, and luck, then adds it to inventory.
import { useCallback } from 'react';
import { ITEMS } from '../data/items';
import { getSpawnableItems, pickRandomItemWithBiome, pickRandomItemLucky } from '../utils/spawning';
export function useItemSpawn({ conditions, biomeInfo, addItem, markDiscovered, consumeTileResource, }) {
    const collect = useCallback((lucky = false) => {
        // Consume one resource from the tile; -1 means already depleted
        const remaining = consumeTileResource();
        if (remaining < 0) {
            return '';
        }
        const spawnable = getSpawnableItems(ITEMS, conditions);
        const item = lucky
            ? pickRandomItemLucky(spawnable, biomeInfo)
            : pickRandomItemWithBiome(spawnable, biomeInfo);
        if (!item)
            return 'Nothing to collect right now. Try a different time or weather.';
        addItem(item.id);
        markDiscovered(item.id);
        const depletedNote = remaining === 0 ? ' (tile now exhausted)' : '';
        return `You found a ${item.emoji} ${item.name}!${depletedNote}`;
    }, [conditions, biomeInfo, addItem, markDiscovered, consumeTileResource]);
    return { collect };
}
