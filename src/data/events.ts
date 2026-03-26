// Static event message templates and world event definitions.
// No logic here — pure message data and event descriptions only.

// ── UI message templates (used by hooks) ─────────────────────────────────────

export const COLLECT_MESSAGES = {
  success: (name: string, emoji: string) => `You found a ${emoji} ${name}!`,
  empty: () => 'Nothing to collect right now. Try a different time or weather.',
};

export const CRAFT_MESSAGES = {
  success: (name: string) => `✨ Crafted: ${name}!`,
  noIngredients: (name: string) => `Not enough ingredients for ${name}.`,
};

export const TIME_MESSAGES = {
  newDay: (day: number) => `🌅 Day ${day} begins.`,
  seasonChange: (season: string) => `🍃 The season changed to ${season}!`,
};

// ── World event flavour text ──────────────────────────────────────────────────

export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  effect: string;
}

export const WORLD_EVENTS: WorldEvent[] = [
  {
    id: 'morning_bloom',
    name: 'Morning Bloom',
    description: 'Flowers bloom across the grove at dawn.',
    effect: 'Flora spawn rate doubled',
  },
  {
    id: 'storm_surge',
    name: 'Storm Surge',
    description: 'A powerful storm energizes the land.',
    effect: 'Rare minerals more likely to appear',
  },
  {
    id: 'firefly_dance',
    name: 'Firefly Dance',
    description: 'Fireflies gather in summer evenings.',
    effect: 'Creatures appear more frequently',
  },
  {
    id: 'harvest_moon',
    name: 'Harvest Moon',
    description: 'The bright harvest moon lights autumn nights.',
    effect: 'Special items have a chance to appear',
  },
  {
    id: 'blizzard_silence',
    name: 'Blizzard Silence',
    description: 'The world goes quiet under heavy snow.',
    effect: 'Winter-exclusive items spawn',
  },
  {
    id: 'misty_morning',
    name: 'Misty Morning',
    description: 'A mysterious mist rolls through the grove.',
    effect: 'Rare flora appear briefly',
  },
];

export const SEASON_DESCRIPTIONS: Record<string, string> = {
  Spring: 'New growth and blooming flowers fill the grove.',
  Summer: 'Warm sun and buzzing insects fill the long days.',
  Autumn: 'Falling leaves and harvest scents fill the crisp air.',
  Winter: 'Frost and silence blanket the grove.',
};

export const WEATHER_DESCRIPTIONS: Record<string, string> = {
  Sunny: 'Clear skies and warm sunlight.',
  Cloudy: 'Soft clouds drift lazily overhead.',
  Rainy: 'A gentle rain patters on the leaves.',
  Foggy: 'A dreamy mist softens everything.',
  Snowy: 'Snowflakes drift silently down.',
};
