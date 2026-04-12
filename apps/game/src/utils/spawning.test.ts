import { describe, expect, it } from 'vitest';
import { ITEMS } from '../data/items';
import type { Item } from '../types/items';
import type { WorldConditions } from '../types/conditions';
import {
  getMaxUnlockedSpawnLayer,
  getSpawnableItems,
  getSpawnableItemsByLayerCatalog,
  getSpawnableItemsByLayer,
  getSpawnableItemsByLayerForUnlock,
  pickRandomItem,
  pickRandomItemLucky,
  pickRandomItemWithBiome,
} from './spawning';
import { BIOME_INFO } from '../data/map';

const conditions: WorldConditions = {
  season: 'Summer',
  weather: 'Sunny',
  timePeriod: 'Morning',
  day: 2,
};

describe('spawning utilities', () => {
  it('computes max unlocked layer by scout points', () => {
    expect(getMaxUnlockedSpawnLayer(0)).toBe(1);
    expect(getMaxUnlockedSpawnLayer(2)).toBe(1);
    expect(getMaxUnlockedSpawnLayer(3)).toBe(2);
    expect(getMaxUnlockedSpawnLayer(7)).toBe(3);
    expect(getMaxUnlockedSpawnLayer(12)).toBe(4);
    expect(getMaxUnlockedSpawnLayer(16)).toBe(5);
  });

  it('excludes weapon and crafted items from spawn candidates', () => {
    const spawnable = getSpawnableItems(ITEMS, conditions, 5, 'forest');
    const ids = new Set(spawnable.map((item) => item.id));

    expect(ids.has('wooden_sword')).toBe(false);
    expect(ids.has('iron_knife')).toBe(false);
    expect(ids.has('grilled_meat')).toBe(false);
  });

  it('keeps mushroom available in foggy cave/forest/swamp conditions and blocks other biomes', () => {
    const foggy: WorldConditions = {
      season: 'Autumn',
      weather: 'Foggy',
      timePeriod: 'Night',
      day: 4,
    };

    const forestMushrooms = getSpawnableItems(ITEMS, foggy, 5, 'forest');
    const swampMushrooms = getSpawnableItems(ITEMS, foggy, 5, 'swamp');
    const desertMushrooms = getSpawnableItems(ITEMS, foggy, 5, 'desert');

    expect(forestMushrooms.some((item) => item.id === 'mushroom')).toBe(true);
    expect(swampMushrooms.some((item) => item.id === 'mushroom')).toBe(true);
    expect(desertMushrooms.some((item) => item.id === 'mushroom')).toBe(false);
  });

  it('fallback returns non-empty candidates when strict filters have no matches', () => {
    const lockedItems: Item[] = [
      {
        id: 'never_now',
        name: 'Winter-only fern',
        description: 'Does not match current season.',
        emoji: '🌿',
        rarity: 1,
        category: 'flora',
        spawnConditions: {
          seasons: ['Winter'],
        },
      },
      {
        id: 'crafted_only',
        name: 'Crafted thing',
        description: 'Should not appear in fallback.',
        emoji: '⚒️',
        rarity: 2,
        category: 'crafted',
        tags: ['craft-base'],
        spawnConditions: {
          seasons: ['Winter'],
        },
      },
      {
        id: 'loot_only',
        name: 'Loot-only',
        description: 'Should not appear in fallback.',
        emoji: '🎒',
        rarity: 1,
        category: 'creature',
        tags: ['loot'],
        spawnConditions: {
          seasons: [],
        },
      },
    ];

    const fallback = getSpawnableItems(lockedItems, conditions, 1, 'meadow');
    expect(fallback.some((item) => item.id === 'never_now')).toBe(true);
    expect(fallback.some((item) => item.id === 'crafted_only')).toBe(false);
    expect(fallback.some((item) => item.id === 'loot_only')).toBe(false);
    expect(fallback.length).toBeGreaterThan(0);
  });

  it('returns only newly unlocked items in a layer', () => {
    const layeredItems: Item[] = [
      {
        id: 'r1',
        name: 'Layer 1 relic',
        description: 'Basic',
        emoji: '🪨',
        rarity: 1,
        category: 'mineral',
        spawnConditions: {},
      },
      {
        id: 'r2',
        name: 'Layer 2 relic',
        description: 'Advanced',
        emoji: '💎',
        rarity: 2,
        category: 'mineral',
        spawnConditions: {},
      },
      {
        id: 'r3',
        name: 'Layer 3 relic',
        description: 'Higher',
        emoji: '⭐',
        rarity: 3,
        category: 'mineral',
        spawnConditions: {},
      },
    ];

    const layer1 = getSpawnableItemsByLayerCatalog(layeredItems, 3, 1);
    const layer2 = getSpawnableItemsByLayerCatalog(layeredItems, 3, 2);

    expect(layer1.map((item) => item.id).sort()).toEqual(['r1']);
    expect(layer2.map((item) => item.id).sort()).toEqual(['r2']);
    expect(layer2.some((item) => item.id === 'r1')).toBe(false);
  });

  it('calculates unlockable layer items independently from transient weather/time conditions', () => {
    const layeredItems: Item[] = [
      {
        id: 'layer-1-basic',
        name: 'Evergreen Moss',
        description: 'Base root ingredient.',
        emoji: '🌿',
        rarity: 1,
        category: 'flora',
        spawnConditions: {},
      },
      {
        id: 'layer-2-always',
        name: 'Cold Bloom',
        description: 'An advanced bloom available across weather.',
        emoji: '❄️',
        rarity: 2,
        category: 'flora',
        spawnConditions: {},
      },
      {
        id: 'layer-2-seasonal',
        name: 'Summer Bloom',
        description: 'A seasonal variation for layer two.',
        emoji: '☀️',
        rarity: 2,
        category: 'flora',
        spawnConditions: {
          seasons: ['Summer'],
        },
      },
    ];

    const now: WorldConditions = {
      season: 'Winter',
      weather: 'Snowy',
      timePeriod: 'Night',
      day: 4,
    };
    const transientLayer2 = getSpawnableItemsByLayer(layeredItems, now, 4, 2, 'cave');
    const stableLayer2 = getSpawnableItemsByLayerForUnlock(layeredItems, 4, 2, 'cave');

    expect(transientLayer2).toHaveLength(1);
    expect(stableLayer2).toHaveLength(2);
  });

  it('returns a null when no candidates are provided', () => {
    expect(pickRandomItem([], 3)).toBeNull();
    expect(pickRandomItemWithBiome([], BIOME_INFO.forest, 3)).toBeNull();
    expect(pickRandomItemLucky([], BIOME_INFO.forest, 3)).toBeNull();
  });

  it('deterministically selects from rarity pool when Math.random is mocked', () => {
    const oldRandom = Math.random;
    Math.random = () => 0;

    try {
      const pick = pickRandomItem(ITEMS, 5);
      const biomePick = pickRandomItemWithBiome(ITEMS, BIOME_INFO.forest, 5);
      const luckyPick = pickRandomItemLucky(ITEMS, BIOME_INFO.forest, 5);

      expect(pick).toBeDefined();
      expect(biomePick).toBeDefined();
      expect(luckyPick).toBeDefined();
    } finally {
      Math.random = oldRandom;
    }
  });
});
