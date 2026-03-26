// Pure function: given world conditions + item list, returns items that can spawn.
// No React imports. No side effects.

import type { Item } from '../types/items';
import type { WorldConditions } from '../types/conditions';

/**
 * Returns items whose spawnConditions match the current world conditions.
 * A condition key is optional; if absent, it matches any value.
 */
export function getSpawnableItems(items: Item[], conditions: WorldConditions): Item[] {
  return items.filter((item) => {
    const { seasons, weathers, timePeriods } = item.spawnConditions;
    if (seasons && !seasons.includes(conditions.season)) return false;
    if (weathers && !weathers.includes(conditions.weather)) return false;
    if (timePeriods && !timePeriods.includes(conditions.timePeriod)) return false;
    return true;
  });
}

/** Picks a random item from a list with rarity-weighted probability. */
export function pickRandomItem(items: Item[]): Item | null {
  if (items.length === 0) return null;
  const weights: Record<string, number> = { common: 5, uncommon: 3, rare: 1 };
  const pool = items.flatMap((item) =>
    Array(weights[item.rarity] ?? 1).fill(item)
  );
  return pool[Math.floor(Math.random() * pool.length)] as Item;
}
