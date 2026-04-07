// Pure functions: spawning logic for world items.
// No React imports. No side effects.

import type { Item } from '../types/items';
import type { WorldConditions } from '../types/conditions';
import type { BiomeInfo } from '../types/map';
import type { BiomeType } from '../types/map';

export const SPAWN_REVEAL_TIERS = [1, 2, 3, 4, 5] as const;
export const MAX_SPAWN_REVEAL_LEVEL = SPAWN_REVEAL_TIERS.length;
export const SPAWN_LAYER_UNLOCK_COST_BY_LEVEL: Record<number, number> = {
  1: 0,
  2: 3,
  3: 7,
  4: 11,
  5: 16,
};

export function getMaxUnlockedSpawnLayer(scoutPoints: number): number {
  let level = 1;
  for (const tier of SPAWN_REVEAL_TIERS) {
    if (scoutPoints < (SPAWN_LAYER_UNLOCK_COST_BY_LEVEL[tier] ?? 0)) break;
    level = tier;
  }
  return level;
}

function getMaxRarityForRevealLevel(revealLevel: number): number {
  const clampedLevel = Math.max(1, Math.min(Math.max(1, Math.floor(revealLevel)), MAX_SPAWN_REVEAL_LEVEL));
  return SPAWN_REVEAL_TIERS[clampedLevel - 1] ?? 5;
}

/**
 * Returns items whose spawnConditions match the current world conditions.
 * A condition key is optional; if absent, it matches any value.
 */
export function getSpawnableItems(
  items: Item[],
  conditions: WorldConditions,
  scoutRevealLevel: number = MAX_SPAWN_REVEAL_LEVEL,
  biomeType?: BiomeType,
): Item[] {
  return items.filter((item) => {
    if (item.category === 'weapon') return false;
    const { seasons, weathers, timePeriods, biomes } = item.spawnConditions;
    if (seasons && !seasons.includes(conditions.season)) return false;
    if (weathers && !weathers.includes(conditions.weather)) return false;
    if (timePeriods && !timePeriods.includes(conditions.timePeriod)) return false;
    if (
      biomes &&
      biomes.length > 0 &&
      biomeType &&
      !biomes.includes('everywhere') &&
      !biomes.includes(biomeType)
    ) {
      return false;
    }
    if (item.rarity > getMaxRarityForRevealLevel(scoutRevealLevel)) return false;
    return true;
  });
}

export function getBaseSpawnableItems(items: Item[]): Item[] {
  return items.filter((item) => item.category !== 'weapon' && item.tags?.includes('base-resource'));
}

/**
 * Returns only the newly unlocked items at the requested tech layer.
 * 
 * layer 1: items unlocked at tier 1.
 * layer 2: items unlocked at tier 2 only (excluding layers 1).
 */
export function getSpawnableItemsByLayer(
  items: Item[],
  conditions: WorldConditions,
  scoutRevealLevel: number = MAX_SPAWN_REVEAL_LEVEL,
  selectedLayer: number = scoutRevealLevel,
  biomeType?: BiomeType,
): Item[] {
  const revealLevel = Math.max(0, Math.min(Math.floor(scoutRevealLevel), MAX_SPAWN_REVEAL_LEVEL));
  const requestedLayer = Math.max(0, Math.min(Math.floor(selectedLayer), MAX_SPAWN_REVEAL_LEVEL));
  if (requestedLayer > revealLevel) return [];
  if (requestedLayer === 0) return getBaseSpawnableItems(items);
  const currentLayerItems = getSpawnableItems(items, conditions, requestedLayer, biomeType);
  const previousLayerItems =
    requestedLayer > 1 ? getSpawnableItems(items, conditions, requestedLayer - 1, biomeType) : [];
  const previousIds = new Set(previousLayerItems.map((item) => item.id));
  return currentLayerItems.filter((item) => !previousIds.has(item.id));
}

/** Returns all items unlocked up to the visible tech layer. */
export function getSpawnableItemsUpToLayer(
  items: Item[],
  conditions: WorldConditions,
  scoutRevealLevel: number = MAX_SPAWN_REVEAL_LEVEL,
  biomeType?: BiomeType,
): Item[] {
  const revealLevel = Math.max(1, Math.min(Math.floor(scoutRevealLevel), MAX_SPAWN_REVEAL_LEVEL));
  return getSpawnableItems(items, conditions, revealLevel, biomeType);
}

/** Picks a random item from a list with rarity-weighted probability. */
export function pickRandomItem(items: Item[]): Item | null {
  if (items.length === 0) return null;
  const weights = { 1: 5, 2: 3, 3: 1, 4: 1, 5: 1 };
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
  const base: { [key: number]: number } = { 1: 4, 2: 2, 3: 1, 4: 1, 5: 1 };
  const pool = items.flatMap((item) => {
    let w = base[item.rarity] ?? 1;
    if (categoryBonus.has(item.category)) w *= 3;
    if (rarityBonus.has(item.rarity)) w *= 2;
    if (item.category === 'weapon') w *= 3;
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
  const base: { [key: number]: number } = { 1: 2, 2: 4, 3: 5, 4: 3, 5: 3 };
  const pool = items.flatMap((item) => {
    let w = base[item.rarity] ?? 1;
    if (categoryBonus.has(item.category)) w *= 2;
    if (rarityBonus.has(item.rarity)) w *= 2;
    if (item.category === 'weapon') w *= 3;
    return Array(w).fill(item);
  });
  return pool[Math.floor(Math.random() * pool.length)] as Item;
}
