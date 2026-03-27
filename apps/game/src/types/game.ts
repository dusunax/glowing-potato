export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'misty';
export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night' | 'midnight';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface SpawnCondition {
  seasons?: Season[];
  weathers?: Weather[];
  timeOfDay?: TimeOfDay[];
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: ItemRarity;
  spawnCondition: SpawnCondition;
  category: 'flora' | 'mineral' | 'creature' | 'crafted' | 'special';
  tags?: string[];
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  inputs: { itemId: string; quantity: number }[];
  output: { itemId: string; quantity: number };
  unlockCondition?: string;
}

export interface WorldConditions {
  season: Season;
  weather: Weather;
  timeOfDay: TimeOfDay;
  dayCount: number;
  tick: number;
}

export interface DiscoveryEntry {
  id: string;
  itemId: string;
  discoveredAt: {
    season: Season;
    weather: Weather;
    timeOfDay: TimeOfDay;
    dayCount: number;
  };
  timestamp: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  conditions: SpawnCondition;
  effect: string;
}
