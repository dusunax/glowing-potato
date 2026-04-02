// Types for the world map system: biomes, tiles, and player position.

export type BiomeType =
  | 'forest'
  | 'mountain'
  | 'lake'
  | 'meadow'
  | 'plains'
  | 'cave'
  | 'village'
  | 'swamp'
  | 'beach';

export interface BiomeInfo {
  type: BiomeType;
  emoji: string;
  name: string;
  description: string;
  /** Item categories that receive a spawn-weight bonus here */
  categoryBonus: string[];
  /** Item rarities that receive an extra spawn-weight bonus here */
  rarityBonus?: string[];
}

export interface PlayerPosition {
  x: number;
  y: number;
}
