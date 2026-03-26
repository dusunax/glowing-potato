// Static item definitions. No logic here — pure data only.
// To add a new item: copy an entry and adjust id, name, emoji, rarity, spawnConditions.

import type { Item } from '../types/items';

export const ITEMS: Item[] = [
  {
    id: 'sunflower',
    name: 'Sunflower',
    emoji: '🌻',
    description: 'A bright flower that faces the sun.',
    rarity: 'common',
    spawnConditions: {
      seasons: ['Spring', 'Summer'],
      weathers: ['Sunny'],
      timePeriods: ['Morning', 'Afternoon'],
    },
  },
  {
    id: 'mushroom',
    name: 'Mushroom',
    emoji: '🍄',
    description: 'Grows best in damp, foggy conditions.',
    rarity: 'common',
    spawnConditions: {
      seasons: ['Autumn'],
      weathers: ['Rainy', 'Foggy'],
    },
  },
  {
    id: 'firefly',
    name: 'Firefly',
    emoji: '✨',
    description: 'A tiny glowing insect of warm nights.',
    rarity: 'uncommon',
    spawnConditions: {
      seasons: ['Summer'],
      timePeriods: ['Evening', 'Night'],
    },
  },
  {
    id: 'crystal',
    name: 'Ice Crystal',
    emoji: '💎',
    description: 'A rare crystal formed in the deep winter night.',
    rarity: 'rare',
    spawnConditions: {
      seasons: ['Winter'],
      weathers: ['Snowy'],
      timePeriods: ['Night'],
    },
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    emoji: '🌲',
    description: 'Falls from pines in the cool season.',
    rarity: 'common',
    spawnConditions: {
      seasons: ['Autumn', 'Winter'],
    },
  },
  {
    id: 'raindrop',
    name: 'Raindrop Vial',
    emoji: '💧',
    description: 'Pure rain collected in a tiny vial.',
    rarity: 'common',
    spawnConditions: {
      weathers: ['Rainy'],
    },
  },
  {
    id: 'moonstone',
    name: 'Moonstone',
    emoji: '🌕',
    description: 'Glimmers only under the night sky.',
    rarity: 'rare',
    spawnConditions: {
      timePeriods: ['Night'],
    },
  },
  {
    id: 'clover',
    name: 'Four-Leaf Clover',
    emoji: '🍀',
    description: 'Hard to find but brings good luck.',
    rarity: 'uncommon',
    spawnConditions: {
      seasons: ['Spring'],
      weathers: ['Sunny', 'Cloudy'],
      timePeriods: ['Morning'],
    },
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    emoji: '❄️',
    description: 'A unique, delicate ice formation.',
    rarity: 'common',
    spawnConditions: {
      seasons: ['Winter'],
      weathers: ['Snowy'],
    },
  },
  {
    id: 'autumn_leaf',
    name: 'Autumn Leaf',
    emoji: '🍂',
    description: 'A golden-red leaf from a turning tree.',
    rarity: 'common',
    spawnConditions: {
      seasons: ['Autumn'],
    },
  },
  {
    id: 'fog_pearl',
    name: 'Fog Pearl',
    emoji: '🫧',
    description: 'A mysterious orb that appears in heavy fog.',
    rarity: 'uncommon',
    spawnConditions: {
      weathers: ['Foggy'],
      timePeriods: ['Morning', 'Evening'],
    },
  },
  {
    id: 'sun_shard',
    name: 'Sun Shard',
    emoji: '🔆',
    description: 'A fragment of solidified sunlight.',
    rarity: 'rare',
    spawnConditions: {
      weathers: ['Sunny'],
      timePeriods: ['Afternoon'],
      seasons: ['Summer'],
    },
  },
];
