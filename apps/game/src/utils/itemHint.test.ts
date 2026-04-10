import { describe, expect, it } from 'vitest';
import type { Item } from '../types/items';
import { getItemSpawnHint } from './itemHint';

describe('getItemSpawnHint', () => {
  const lootOnly: Item = {
    id: 'raw_meat',
    name: 'Raw Meat',
    description: 'Dropped by animals',
    emoji: '🥩',
    rarity: 1,
    category: 'creature',
    tags: ['loot'],
    spawnConditions: {
      seasons: [],
    },
  };

  const everywhere: Item = {
    id: 'branch',
    name: 'Branch',
    description: 'Found almost anywhere',
    emoji: '🪵',
    rarity: 1,
    category: 'crafted',
    tags: ['craft-base'],
    spawnConditions: {
      biomes: ['everywhere'],
    },
  };

  const noHint: Item = {
    id: 'apple_herb_salad',
    name: 'Apple-Herb Salad',
    description: 'Crafted recipe output',
    emoji: '🥗',
    rarity: 3,
    category: 'creature',
    tags: ['food', 'cooking'],
    spawnConditions: {},
  };

  const seasonal: Item = {
    id: 'rain_lily',
    name: 'Rain Lily',
    description: 'No place, only weather',
    emoji: '🌺',
    rarity: 2,
    category: 'flora',
    tags: ['flower'],
    spawnConditions: {
      weathers: ['Rainy', 'Cloudy'],
      timePeriods: ['Afternoon'],
    },
  };

  it('describes loot items', () => {
    expect(getItemSpawnHint(lootOnly)).toBe('Dropped by animals');
  });

  it('describes everywhere items', () => {
    expect(getItemSpawnHint(everywhere)).toBe('Found everywhere');
  });

  it('describes unrestricted crafted materials', () => {
    expect(getItemSpawnHint(noHint)).toBe('Crafting material only');
  });

  it('describes specific weather/time conditions', () => {
    expect(getItemSpawnHint(seasonal)).toBe('Weather: Rainy, Cloudy | Time: Afternoon');
  });
});
