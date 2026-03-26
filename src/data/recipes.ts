import type { Recipe } from '../types/game';

export const RECIPES: Recipe[] = [
  {
    id: 'dawn_tea',
    name: 'Dawn Tea',
    emoji: '🍵',
    description: 'A calming tea brewed from morning dew flowers. Reveals hidden spawns.',
    inputs: [
      { itemId: 'morning_dew_flower', quantity: 2 },
      { itemId: 'river_stone', quantity: 1 },
    ],
    output: { itemId: 'dawn_tea', quantity: 1 },
  },
  {
    id: 'sunlight_elixir',
    name: 'Sunlight Elixir',
    emoji: '☀️',
    description: 'A glowing potion made from summer ingredients.',
    inputs: [
      { itemId: 'sunpetal', quantity: 3 },
      { itemId: 'sunstone', quantity: 1 },
      { itemId: 'sunberry', quantity: 2 },
    ],
    output: { itemId: 'sunlight_elixir', quantity: 1 },
  },
  {
    id: 'storm_lantern',
    name: 'Storm Lantern',
    emoji: '🏮',
    description: 'A lantern charged with storm energy. Lights up the night.',
    inputs: [
      { itemId: 'storm_shard', quantity: 1 },
      { itemId: 'storm_mushroom', quantity: 2 },
      { itemId: 'river_stone', quantity: 2 },
    ],
    output: { itemId: 'storm_lantern', quantity: 1 },
  },
  {
    id: 'moonstone_pendant',
    name: 'Moonstone Pendant',
    emoji: '📿',
    description: 'A beautiful pendant that glows at night.',
    inputs: [
      { itemId: 'moonstone', quantity: 1 },
      { itemId: 'moongrass', quantity: 3 },
      { itemId: 'night_moth', quantity: 1 },
    ],
    output: { itemId: 'moonstone_pendant', quantity: 1 },
  },
  {
    id: 'winter_charm',
    name: 'Winter Charm',
    emoji: '🔮',
    description: "A magical charm woven from winter's rarest finds.",
    inputs: [
      { itemId: 'frostbloom', quantity: 1 },
      { itemId: 'winter_berry', quantity: 3 },
      { itemId: 'frost_sprite', quantity: 1 },
    ],
    output: { itemId: 'winter_charm', quantity: 1 },
  },
  {
    id: 'lucky_bouquet',
    name: 'Lucky Bouquet',
    emoji: '💐',
    description: 'A beautiful bouquet said to bring good fortune.',
    inputs: [
      { itemId: 'four_leaf_clover', quantity: 1 },
      { itemId: 'spring_butterfly', quantity: 1 },
      { itemId: 'rain_lily', quantity: 2 },
      { itemId: 'morning_dew_flower', quantity: 1 },
    ],
    output: { itemId: 'lucky_bouquet', quantity: 1 },
  },
  {
    id: 'celestial_crown',
    name: 'Celestial Crown',
    emoji: '👑',
    description: 'A legendary crown made from celestial fragments.',
    inputs: [
      { itemId: 'star_fragment', quantity: 2 },
      { itemId: 'moonstone', quantity: 2 },
      { itemId: 'sunstone', quantity: 1 },
      { itemId: 'frost_sprite', quantity: 1 },
    ],
    output: { itemId: 'celestial_crown', quantity: 1 },
  },
  {
    id: 'firefly_jar',
    name: 'Firefly Jar',
    emoji: '🫙',
    description: 'A jar filled with glowing fireflies for light.',
    inputs: [
      { itemId: 'firefly', quantity: 3 },
      { itemId: 'river_stone', quantity: 1 },
    ],
    output: { itemId: 'firefly_jar', quantity: 1 },
  },
];

export const CRAFTED_ITEM_IDS = RECIPES.map(r => r.output.itemId);
