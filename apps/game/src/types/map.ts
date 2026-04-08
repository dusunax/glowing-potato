// Types for the world map system: biomes, tiles, and player position.

import type { ItemRarity } from './items';

export type BiomeType =
  | 'forest'
  | 'mountain'
  | 'lake'
  | 'meadow'
  | 'plains'
  | 'cave'
  | 'village'
  | 'treasure'
  | 'swamp'
  | 'beach'
  | 'desert'
  | 'rock'
  | 'everywhere';

export type MapBiomePreset = 'meadow' | 'mountain' | 'beach' | 'desert' | 'rock';

export interface BiomeInfo {
  type: BiomeType;
  emoji: string;
  name: string;
  description: string;
  /** Item categories that receive a spawn-weight bonus here */
  categoryBonus: string[];
  /** Item rarities that receive an extra spawn-weight bonus here */
  rarityBonus?: ItemRarity[];
}

export interface PlayerPosition {
  x: number;
  y: number;
}
