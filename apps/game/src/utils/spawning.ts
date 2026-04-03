// Pure functions: spawning logic for world items.
// No React imports. No side effects.

import type { Item } from '../types/items';
import type { WorldConditions } from '../types/conditions';
import type { BiomeInfo } from '../types/map';

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
  const weights: Record<string, number> = { common: 5, uncommon: 3, rare: 1, legendary: 1 };
  const pool = items.flatMap((item) =>
    Array(weights[item.rarity] ?? 1).fill(item)
  );
  return pool[Math.floor(Math.random() * pool.length)] as Item;
}

/**
 * Picks a random item weighted by both rarity and the current biome's bonuses.
 * Items in the biome's `categoryBonus` list get 3× weight.
 * Items whose rarity is in `rarityBonus` get an additional 2× weight.
 */
export function pickRandomItemWithBiome(items: Item[], biomeInfo: BiomeInfo): Item | null {
  if (items.length === 0) return null;
  const categoryBonus = new Set(biomeInfo.categoryBonus);
  const rarityBonus = new Set(biomeInfo.rarityBonus ?? []);
  const base: Record<string, number> = { common: 4, uncommon: 2, rare: 1, legendary: 1 };
  const pool = items.flatMap((item) => {
    let w = base[item.rarity] ?? 1;
    if (categoryBonus.has(item.category)) w *= 3;
    if (rarityBonus.has(item.rarity)) w *= 2;
    return Array(w).fill(item);
  });
  return pool[Math.floor(Math.random() * pool.length)] as Item;
}

/**
 * Lucky variant: boosts uncommon/rare/legendary weights significantly.
 * Still factors in biome bonuses.
 */
export function pickRandomItemLucky(items: Item[], biomeInfo: BiomeInfo): Item | null {
  if (items.length === 0) return null;
  const categoryBonus = new Set(biomeInfo.categoryBonus);
  const rarityBonus = new Set(biomeInfo.rarityBonus ?? []);
  const base: Record<string, number> = { common: 2, uncommon: 4, rare: 5, legendary: 3 };
  const pool = items.flatMap((item) => {
    let w = base[item.rarity] ?? 1;
    if (categoryBonus.has(item.category)) w *= 2;
    if (rarityBonus.has(item.rarity)) w *= 2;
    return Array(w).fill(item);
  });
  return pool[Math.floor(Math.random() * pool.length)] as Item;
}
