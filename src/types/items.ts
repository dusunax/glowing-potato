// TypeScript interfaces for items.
// To add item properties: extend the Item interface here.

import type { Season } from '../constants/seasons';
import type { Weather } from '../constants/weather';
import type { TimePeriod } from '../constants/timePeriods';

export type ItemId = string;
export type ItemRarity = 'common' | 'uncommon' | 'rare';

export interface SpawnConditions {
  seasons?: Season[];
  weathers?: Weather[];
  timePeriods?: TimePeriod[];
}

export interface Item {
  id: ItemId;
  name: string;
  description: string;
  emoji: string;
  rarity: ItemRarity;
  spawnConditions: SpawnConditions;
}
