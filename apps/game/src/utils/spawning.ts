// Pure functions: spawning logic for world items.
// No React imports. No side effects.

import type { Item } from '../types/items';
import type { WorldConditions } from '../types/conditions';
import type { BiomeInfo } from '../types/map';
import type { BiomeType } from '../types/map';
import { RECIPES } from '../data/recipes';

export const SPAWN_REVEAL_TIERS = [1, 2, 3, 4, 5] as const;
export const MAX_SPAWN_REVEAL_LEVEL = SPAWN_REVEAL_TIERS.length;
export const SPAWN_LAYER_UNLOCK_COST_BY_LEVEL: Record<number, number> = {
  1: 0,
  2: 3,
  3: 7,
  4: 11,
  5: 16,
};

const CRAFT_RESULT_ITEM_IDS = new Set(RECIPES.map((recipe) => recipe.result.itemId));

export function isNeverForaged(item: Item): boolean {
  const { seasons, weathers, timePeriods, biomes } = item.spawnConditions;
  return (
    (seasons !== undefined && seasons.length === 0) ||
    (weathers !== undefined && weathers.length === 0) ||
    (timePeriods !== undefined && timePeriods.length === 0) ||
    (biomes !== undefined && biomes.length === 0)
  );
}

export function shouldSkipItemFromSpawn(item: Item): boolean {
  return item.category === 'weapon' || CRAFT_RESULT_ITEM_IDS.has(item.id);
}

export function isSpawnableItem(item: Item): boolean {
  return !isNeverForaged(item) && !shouldSkipItemFromSpawn(item);
}

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
  const maxRarity = getMaxRarityForRevealLevel(scoutRevealLevel);
  const strictMatches = items.filter((item) => {
    if (shouldSkipItemFromSpawn(item)) return false;
    if (item.id === 'mushroom') {
      if (!biomeType) return false;
      const isFoggy = conditions.weather === 'Foggy';
      if (!isFoggy && biomeType !== 'cave') return false;
      if (isFoggy && biomeType !== 'cave' && biomeType !== 'forest' && biomeType !== 'swamp') return false;
      if (biomeType === 'cave') {
        return item.rarity <= getMaxRarityForRevealLevel(scoutRevealLevel);
      }
    }
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
    if (item.rarity > maxRarity) return false;
    return true;
  });

  if (strictMatches.length > 0) return strictMatches;

  return items.filter((item) => {
    if (shouldSkipItemFromSpawn(item) || isNeverForaged(item)) return false;
    if (item.rarity > maxRarity) return false;
    return true;
  });
}

export function getBaseSpawnableItems(items: Item[]): Item[] {
  return items.filter(
    (item) =>
      !shouldSkipItemFromSpawn(item) &&
      item.tags?.includes('base-resource'),
  );
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
  const strictCurrentLayerItems = getSpawnableItems(items, conditions, requestedLayer, biomeType);
  const strictPreviousLayerItems =
    requestedLayer > 1 ? getSpawnableItems(items, conditions, requestedLayer - 1, biomeType) : [];
  const fallbackNeeded = strictCurrentLayerItems.length === 0 && strictPreviousLayerItems.length === 0;

  const currentLayerItems = fallbackNeeded
    ? getSpawnableItemsByLayerCatalog(items, requestedLayer, requestedLayer, biomeType)
    : strictCurrentLayerItems;
  const previousLayerItems = fallbackNeeded
    ? (
        requestedLayer > 1
          ? getSpawnableItemsByLayerCatalog(items, requestedLayer - 1, requestedLayer - 1, biomeType)
          : []
      )
    : strictPreviousLayerItems;
  const previousIds = new Set(previousLayerItems.map((item) => item.id));
  return currentLayerItems.filter((item) => !previousIds.has(item.id));
}

export function getSpawnableItemsByLayerForUnlock(
  items: Item[],
  scoutRevealLevel: number = MAX_SPAWN_REVEAL_LEVEL,
  selectedLayer: number = scoutRevealLevel,
  biomeType?: BiomeType,
): Item[] {
  const revealLevel = Math.max(1, Math.min(Math.floor(scoutRevealLevel), MAX_SPAWN_REVEAL_LEVEL));
  const normalizedLayer = Math.max(1, Math.min(Math.floor(selectedLayer), MAX_SPAWN_REVEAL_LEVEL));
  if (normalizedLayer > revealLevel) return [];

  const currentLayerItems = getSpawnableItemsByLayerCatalog(items, revealLevel, normalizedLayer, biomeType);
  const previousLayerItems =
    normalizedLayer > 1 ? getSpawnableItemsByLayerCatalog(items, revealLevel, normalizedLayer - 1, biomeType) : [];

  const previousIds = new Set(previousLayerItems.map((item) => item.id));
  return currentLayerItems.filter((item) => !previousIds.has(item.id));
}

export function getSpawnableItemsByLayerCatalog(
  items: Item[],
  scoutRevealLevel: number = MAX_SPAWN_REVEAL_LEVEL,
  selectedLayer: number = scoutRevealLevel,
  biomeType?: BiomeType,
): Item[] {
  const revealLevel = Math.max(0, Math.min(Math.floor(scoutRevealLevel), MAX_SPAWN_REVEAL_LEVEL));
  const requestedLayer = Math.max(0, Math.min(Math.floor(selectedLayer), MAX_SPAWN_REVEAL_LEVEL));
  if (requestedLayer > revealLevel) return [];

  const currentLayerItems = items.filter((item) => {
    if (shouldSkipItemFromSpawn(item)) return false;
    if (item.rarity > getMaxRarityForRevealLevel(requestedLayer)) return false;
    if (
      item.spawnConditions.biomes &&
      item.spawnConditions.biomes.length > 0 &&
      biomeType &&
      !item.spawnConditions.biomes.includes('everywhere') &&
      !item.spawnConditions.biomes.includes(biomeType)
      ) {
      return false;
    }
    return true;
  });

  const filteredCurrentLayerItems =
    currentLayerItems.length > 0
      ? currentLayerItems
      : items.filter((item) => {
          if (shouldSkipItemFromSpawn(item) || isNeverForaged(item)) return false;
          if (item.rarity > getMaxRarityForRevealLevel(requestedLayer)) return false;
          return true;
        });

  const previousLayerItems =
    requestedLayer > 1
      ? items.filter((item) => {
          if (shouldSkipItemFromSpawn(item) || isNeverForaged(item)) return false;
          if (item.rarity > getMaxRarityForRevealLevel(requestedLayer - 1)) return false;
          return true;
        })
      : [];
  const previousIds = new Set(previousLayerItems.map((item) => item.id));
  const availableItems = filteredCurrentLayerItems.filter((item) => !previousIds.has(item.id));
  return availableItems;
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

function getAdvancedSpawnBias(
  scoutRevealLevel: number,
  itemRarity: Item['rarity'],
): number {
  const cappedLevel = Math.max(1, Math.min(Math.floor(scoutRevealLevel), MAX_SPAWN_REVEAL_LEVEL));
  const maxRarity = getMaxRarityForRevealLevel(cappedLevel);
  const normalized = itemRarity / Math.max(1, maxRarity);
  return Math.max(0.25, normalized);
}

/** Picks a random item from a list with rarity-weighted probability. */
export function pickRandomItem(
  items: Item[],
  scoutRevealLevel: number = MAX_SPAWN_REVEAL_LEVEL,
): Item | null {
  if (items.length === 0) return null;
  const weights = { 1: 5, 2: 3, 3: 1, 4: 1, 5: 1 };
  const pool = items.flatMap((item) => {
    const baseWeight = Math.max(1, weights[item.rarity] ?? 1);
    const weighted = baseWeight * getAdvancedSpawnBias(scoutRevealLevel, item.rarity);
    const repeat = Math.max(1, Math.floor(weighted));
    return Array(repeat).fill(item);
  });
  return pool[Math.floor(Math.random() * pool.length)] as Item;
}

/**
 * Picks a random item weighted by both rarity and the current biome's bonuses.
 * Items in the biome's `categoryBonus` list get 3× weight.
 * Items whose rarity is in `rarityBonus` get an additional 2× weight.
 */
export function pickRandomItemWithBiome(
  items: Item[],
  biomeInfo: BiomeInfo,
  scoutRevealLevel: number = MAX_SPAWN_REVEAL_LEVEL,
): Item | null {
  if (items.length === 0) return null;
  const revealLevel = Math.max(1, Math.min(Math.floor(scoutRevealLevel), MAX_SPAWN_REVEAL_LEVEL));
  const categoryBonus = new Set(biomeInfo.categoryBonus);
  const rarityBonus = new Set(biomeInfo.rarityBonus ?? []);
  const base: { [key: number]: number } = { 1: 4, 2: 2, 3: 1, 4: 1, 5: 1 };
  const pool = items.flatMap((item) => {
    let w = base[item.rarity] ?? 1;
    if (categoryBonus.has(item.category)) w *= 3;
    if (rarityBonus.has(item.rarity)) w *= 2;
    if (item.category === 'weapon') w *= 3;
    w *= getAdvancedSpawnBias(revealLevel, item.rarity);
    return Array(Math.max(1, Math.floor(w))).fill(item);
  });
  return pool[Math.floor(Math.random() * pool.length)] as Item;
}

/**
 * Lucky variant: boosts uncommon/rare/legendary weights significantly.
 * Still factors in biome bonuses.
 */
export function pickRandomItemLucky(
  items: Item[],
  biomeInfo: BiomeInfo,
  scoutRevealLevel: number = MAX_SPAWN_REVEAL_LEVEL,
): Item | null {
  if (items.length === 0) return null;
  const revealLevel = Math.max(1, Math.min(Math.floor(scoutRevealLevel), MAX_SPAWN_REVEAL_LEVEL));
  const categoryBonus = new Set(biomeInfo.categoryBonus);
  const rarityBonus = new Set(biomeInfo.rarityBonus ?? []);
  const base: { [key: number]: number } = { 1: 2, 2: 4, 3: 5, 4: 3, 5: 3 };
  const pool = items.flatMap((item) => {
    let w = base[item.rarity] ?? 1;
    if (categoryBonus.has(item.category)) w *= 2;
    if (rarityBonus.has(item.rarity)) w *= 2;
    if (item.category === 'weapon') w *= 3;
    const luckyBoost = 0.75 + 0.25 * getAdvancedSpawnBias(revealLevel, item.rarity);
    return Array(Math.max(1, Math.floor(w * luckyBoost))).fill(item);
  });
  return pool[Math.floor(Math.random() * pool.length)] as Item;
}
