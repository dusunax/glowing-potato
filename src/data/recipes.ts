// Static recipe definitions. No logic — pure data only.
// To add a new recipe: copy an entry and adjust id, name, ingredients, result.

import type { Recipe } from '../types/recipes';

export const RECIPES: Recipe[] = [
  {
    id: 'flower_crown',
    name: 'Flower Crown',
    description: 'A beautiful crown woven from sunflowers.',
    ingredients: [{ itemId: 'sunflower', quantity: 3 }],
    result: { itemId: 'clover', quantity: 1 },
  },
  {
    id: 'mushroom_soup',
    name: 'Mushroom Soup',
    description: 'A warm autumnal soup.',
    ingredients: [
      { itemId: 'mushroom', quantity: 2 },
      { itemId: 'raindrop', quantity: 1 },
    ],
    result: { itemId: 'fog_pearl', quantity: 1 },
  },
  {
    id: 'winter_charm',
    name: 'Winter Charm',
    description: 'A charm made from the essence of winter.',
    ingredients: [
      { itemId: 'snowflake', quantity: 2 },
      { itemId: 'pinecone', quantity: 1 },
    ],
    result: { itemId: 'crystal', quantity: 1 },
  },
  {
    id: 'night_lantern',
    name: 'Night Lantern',
    description: 'A lantern that glows like fireflies.',
    ingredients: [
      { itemId: 'firefly', quantity: 2 },
      { itemId: 'moonstone', quantity: 1 },
    ],
    result: { itemId: 'sun_shard', quantity: 1 },
  },
  {
    id: 'autumn_wreath',
    name: 'Autumn Wreath',
    description: 'A decorative wreath from fallen leaves.',
    ingredients: [
      { itemId: 'autumn_leaf', quantity: 3 },
      { itemId: 'pinecone', quantity: 1 },
    ],
    result: { itemId: 'moonstone', quantity: 1 },
  },
];
