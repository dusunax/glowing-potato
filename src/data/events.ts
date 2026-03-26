import type { GameEvent } from '../types/game';

export const WORLD_EVENTS: GameEvent[] = [
  {
    id: 'morning_bloom',
    name: 'Morning Bloom',
    description: 'Flowers bloom across the grove at dawn.',
    conditions: { timeOfDay: ['dawn', 'morning'], seasons: ['spring'] },
    effect: 'Flora spawn rate doubled',
  },
  {
    id: 'storm_surge',
    name: 'Storm Surge',
    description: 'A powerful storm energizes the land.',
    conditions: { weathers: ['stormy'] },
    effect: 'Rare minerals more likely to appear',
  },
  {
    id: 'firefly_dance',
    name: 'Firefly Dance',
    description: 'Fireflies gather in summer evenings.',
    conditions: { seasons: ['summer'], timeOfDay: ['dusk', 'night'] },
    effect: 'Creatures appear more frequently',
  },
  {
    id: 'harvest_moon',
    name: 'Harvest Moon',
    description: 'The bright harvest moon lights autumn nights.',
    conditions: { seasons: ['autumn'], timeOfDay: ['night', 'midnight'] },
    effect: 'Special items have a chance to appear',
  },
  {
    id: 'blizzard_silence',
    name: 'Blizzard Silence',
    description: 'The world goes quiet under heavy snow.',
    conditions: { seasons: ['winter'], weathers: ['snowy'] },
    effect: 'Winter-exclusive items spawn',
  },
  {
    id: 'misty_morning',
    name: 'Misty Morning',
    description: 'A mysterious mist rolls through the grove.',
    conditions: { weathers: ['misty'], timeOfDay: ['dawn'] },
    effect: 'Rare flora appear briefly',
  },
];

export const SEASON_DESCRIPTIONS: Record<string, string> = {
  spring: 'New growth and blooming flowers fill the grove.',
  summer: 'Warm sun and buzzing insects fill the long days.',
  autumn: 'Falling leaves and harvest scents fill the crisp air.',
  winter: 'Frost and silence blanket the grove.',
};

export const WEATHER_DESCRIPTIONS: Record<string, string> = {
  sunny: 'Clear skies and warm sunlight.',
  cloudy: 'Soft clouds drift lazily overhead.',
  rainy: 'A gentle rain patters on the leaves.',
  stormy: 'Thunder rumbles as lightning flashes.',
  snowy: 'Snowflakes drift silently down.',
  misty: 'A dreamy mist softens everything.',
};
