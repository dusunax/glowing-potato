// TypeScript interfaces for items.
// To add item properties: extend the Item interface here.

import type { Season } from '../constants/seasons';
import type { Weather } from '../constants/weather';
import type { TimePeriod } from '../constants/timePeriods';
import type { BiomeType } from './map';

export type ItemId = string;
export type ItemRarity = 1 | 2 | 3 | 4 | 5;
export type ItemCategory = 'flora' | 'mineral' | 'creature' | 'special' | 'crafted' | 'weapon';

export interface SpawnConditions {
  seasons?: Season[];
  weathers?: Weather[];
  timePeriods?: TimePeriod[];
  biomes?: BiomeType[];
}

export interface Item {
  id: ItemId;
  itemNo?: number;
  name: string;
  description: string;
  emoji: string;
  rarity: ItemRarity;
  category: ItemCategory;
  tags?: string[];
  spawnConditions: SpawnConditions;
  /** Extra damage used when this item is equipped as a weapon. */
  attackPower?: number;
  /** Health restored when consumed as food or potion. */
  healingAmount?: number;
  /** Experience gained when consumed. */
  xpGain?: number;
}
