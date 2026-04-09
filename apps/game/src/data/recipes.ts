// Static recipe definitions. No logic — pure data only.
// To add a new recipe: copy an entry and adjust id, name, ingredients, result.

import type { Recipe } from '../types/recipes';

export const RECIPES: Recipe[] = [
  {
    id: 'flower_crown',
    name: 'Flower Crown',
    description: 'A beautiful crown woven from sunflowers and spring blossoms.',
    ingredients: [
      { itemId: 'sunflower', quantity: 2 },
      { itemId: 'morning_dew_flower', quantity: 1 },
    ],
    result: { itemId: 'four_leaf_clover', quantity: 1 },
  },
  {
    id: 'hunter_stew',
    name: 'Hunter Stew',
    description: 'A hearty stew cooked from game meat and mushrooms.',
    ingredients: [
      { itemId: 'raw_meat', quantity: 1 },
      { itemId: 'mushroom', quantity: 1 },
      { itemId: 'raindrop', quantity: 1 },
    ],
    result: { itemId: 'hunter_stew', quantity: 1 },
  },
  {
    id: 'grilled_meat',
    name: 'Grilled Meat',
    description: 'Meat cooked over a branch-fire.',
    ingredients: [
      { itemId: 'raw_meat', quantity: 1 },
      { itemId: 'branch', quantity: 1 },
    ],
    result: { itemId: 'grilled_meat', quantity: 1 },
  },
  {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    description: 'Carve a sturdy branch into a lightweight weapon.',
    ingredients: [{ itemId: 'branch', quantity: 2 }],
    result: { itemId: 'wooden_sword', quantity: 1 },
  },
  {
    id: 'stone_blade',
    name: 'Stone Blade',
    description: 'Bind a sharpened stone onto a branch and shape it into a blade.',
    ingredients: [
      { itemId: 'branch', quantity: 1 },
      { itemId: 'stone', quantity: 2 },
    ],
    result: { itemId: 'stone_blade', quantity: 1 },
  },
  {
    id: 'bone_spear',
    name: 'Bone Spear',
    description: 'Bind a harvested bone and stone onto a long branch for harder-hitting attacks.',
    ingredients: [
      { itemId: 'branch', quantity: 1 },
      { itemId: 'stone', quantity: 1 },
      { itemId: 'bone', quantity: 2 },
    ],
    result: { itemId: 'bone_spear', quantity: 1 },
  },
  {
    id: 'mushroom_soup',
    name: 'Mushroom Soup',
    description: 'A warm autumnal soup brewed from autumn finds.',
    ingredients: [
      { itemId: 'mushroom', quantity: 2 },
      { itemId: 'raindrop', quantity: 1 },
    ],
    result: { itemId: 'mushroom_soup', quantity: 1 },
  },
  {
    id: 'fruit_herb_salad',
    name: 'Apple-Herb Salad',
    description: 'A refreshing salad made from apples and wild herbs.',
    ingredients: [
      { itemId: 'apple', quantity: 1 },
      { itemId: 'sunberry', quantity: 1 },
      { itemId: 'herb', quantity: 1 },
    ],
    result: { itemId: 'apple_herb_salad', quantity: 1 },
  },
  {
    id: 'clam_soup',
    name: 'Clam Soup',
    description: 'A rich warm soup brewed from fresh clams and sea air.',
    ingredients: [
      { itemId: 'clam', quantity: 2 },
      { itemId: 'raindrop', quantity: 1 },
    ],
    result: { itemId: 'clam_soup', quantity: 1 },
  },
  {
    id: 'healing_potion',
    name: 'Healing Potion',
    description: 'A restorative tonic brewed from moongrass and frostbloom.',
    ingredients: [
      { itemId: 'moongrass', quantity: 2 },
      { itemId: 'frostbloom', quantity: 1 },
      { itemId: 'raindrop', quantity: 1 },
    ],
    result: { itemId: 'healing_potion', quantity: 1 },
  },
  {
    id: 'winter_charm',
    name: 'Winter Charm',
    description: 'A magical charm woven from winter\'s rarest finds.',
    ingredients: [
      { itemId: 'frostbloom', quantity: 1 },
      { itemId: 'winter_berry', quantity: 2 },
      { itemId: 'pinecone', quantity: 1 },
    ],
    result: { itemId: 'frost_sprite', quantity: 1 },
  },
  {
    id: 'moonstone_pendant',
    name: 'Moonstone Pendant',
    description: 'A beautiful pendant that glows at night.',
    ingredients: [
      { itemId: 'moonstone', quantity: 1 },
      { itemId: 'moongrass', quantity: 2 },
      { itemId: 'night_moth', quantity: 1 },
    ],
    result: { itemId: 'star_fragment', quantity: 1 },
  },
  {
    id: 'firefly_jar',
    name: 'Firefly Jar',
    description: 'A jar filled with glowing fireflies for light.',
    ingredients: [
      { itemId: 'firefly', quantity: 3 },
      { itemId: 'river_stone', quantity: 1 },
    ],
    result: { itemId: 'sunstone', quantity: 1 },
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
  {
    id: 'lucky_bouquet',
    name: 'Lucky Bouquet',
    description: 'A beautiful bouquet said to bring good fortune.',
    ingredients: [
      { itemId: 'four_leaf_clover', quantity: 1 },
      { itemId: 'spring_butterfly', quantity: 1 },
      { itemId: 'rain_lily', quantity: 2 },
    ],
    result: { itemId: 'ancient_seed', quantity: 1 },
  },
  {
    id: 'celestial_crown',
    name: 'Celestial Crown',
    description: 'A legendary crown made from celestial fragments.',
    ingredients: [
      { itemId: 'star_fragment', quantity: 2 },
      { itemId: 'moonstone', quantity: 2 },
      { itemId: 'sunstone', quantity: 1 },
    ],
    result: { itemId: 'frost_sprite', quantity: 1 },
  },
];
