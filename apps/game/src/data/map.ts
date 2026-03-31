// Static map data: 5x5 grid of biome types and biome info lookup.
// No logic — pure data only.

import type { BiomeType, BiomeInfo } from '../types/map';
import type { PlayerPosition } from '../types/map';

/**
 * 5×5 world map grid. Indexed as MAP_GRID[row (y)][col (x)].
 *
 *   col: 0         1          2        3        4
 * row 0: mountain  mountain   forest   forest   forest
 * row 1: mountain  lake       forest   meadow   meadow
 * row 2: village   lake       meadow   meadow   plains
 * row 3: plains    plains     meadow   swamp    swamp
 * row 4: beach     beach      plains   swamp    cave
 */
// prettier-ignore
export const MAP_GRID: BiomeType[][] = [
  ['mountain', 'mountain', 'forest', 'forest', 'forest'],
  ['mountain', 'lake',     'forest', 'meadow', 'meadow'],
  ['village',  'lake',     'meadow', 'meadow', 'plains'],
  ['plains',   'plains',   'meadow', 'swamp',  'swamp'],
  ['beach',    'beach',    'plains', 'swamp',  'cave'],
];

export const MAP_ROWS = MAP_GRID.length;
export const MAP_COLS = MAP_GRID[0].length;

export const INITIAL_PLAYER_POSITION: PlayerPosition = { x: 0, y: 2 }; // Village

export const BIOME_INFO: Record<BiomeType, BiomeInfo> = {
  forest: {
    type: 'forest',
    emoji: '🌲',
    name: 'Forest',
    description: 'Dense woodland teeming with flora and hidden creatures.',
    categoryBonus: ['flora', 'creature'],
  },
  mountain: {
    type: 'mountain',
    emoji: '⛰️',
    name: 'Mountain',
    description: 'Rocky peaks rich in rare minerals and crystals.',
    categoryBonus: ['mineral'],
    rarityBonus: ['rare'],
  },
  lake: {
    type: 'lake',
    emoji: '🏞️',
    name: 'Lake',
    description: 'A serene lake where aquatic creatures thrive.',
    categoryBonus: ['creature', 'mineral'],
  },
  meadow: {
    type: 'meadow',
    emoji: '🌿',
    name: 'Meadow',
    description: 'Open fields bursting with blooming flowers and insects.',
    categoryBonus: ['flora', 'creature'],
  },
  plains: {
    type: 'plains',
    emoji: '🌾',
    name: 'Plains',
    description: 'Balanced lands where all types of items may appear.',
    categoryBonus: [],
  },
  cave: {
    type: 'cave',
    emoji: '🕳️',
    name: 'Cave',
    description: 'Dark caverns hiding rare minerals and special finds.',
    categoryBonus: ['mineral', 'special'],
    rarityBonus: ['rare', 'legendary'],
  },
  village: {
    type: 'village',
    emoji: '🏡',
    name: 'Village',
    description: 'A cozy settlement. All common goods can be found here.',
    categoryBonus: [],
  },
  swamp: {
    type: 'swamp',
    emoji: '🌊',
    name: 'Swamp',
    description: 'Murky wetlands with unusual flora and strange creatures.',
    categoryBonus: ['flora', 'creature'],
    rarityBonus: ['uncommon'],
  },
  beach: {
    type: 'beach',
    emoji: '🏖️',
    name: 'Beach',
    description: 'Sandy shores where special and mineral finds wash ashore.',
    categoryBonus: ['special', 'mineral'],
  },
};
