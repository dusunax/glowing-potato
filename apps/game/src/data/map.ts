// Static map data: 5x5 grid of biome types, biome info, and maze passage definitions.
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

// ── Maze passage definitions ──────────────────────────────────────────────────
//
// Passages are stored as a Set of canonical edge keys:
//   Horizontal: `h:${x},${y}` = open passage between (x,y) and (x+1,y)
//   Vertical:   `v:${x},${y}` = open passage between (x,y) and (x,y+1)
//
// This set was hand-crafted to form a valid connected maze (all 25 cells
// reachable from the starting village at (0,2)).  There are 3 extra edges
// beyond a spanning tree to give the maze a few cycles.

export const MAZE_PASSAGES = new Set<string>([
  // Horizontal edges  (x,y)↔(x+1,y)
  'h:0,0', 'h:2,0', 'h:3,0',          // row 0
  'h:1,1', 'h:3,1',                    // row 1
  'h:0,2', 'h:2,2',                    // row 2
  'h:0,3', 'h:2,3', 'h:3,3',          // row 3
  'h:0,4', 'h:2,4',                    // row 4

  // Vertical edges  (x,y)↔(x,y+1)
  'v:0,1', 'v:0,2', 'v:0,3',          // col 0
  'v:1,0', 'v:1,1', 'v:1,3',          // col 1
  'v:2,0', 'v:2,1', 'v:2,2', 'v:2,3', // col 2
  'v:3,0', 'v:3,1', 'v:3,3',          // col 3
  'v:4,0', 'v:4,2', 'v:4,3',          // col 4
]);

/** Returns true if there is an open maze passage between the two orthogonally-adjacent tiles. */
export function hasPassage(x1: number, y1: number, x2: number, y2: number): boolean {
  if (y1 === y2) {
    const lx = Math.min(x1, x2);
    return MAZE_PASSAGES.has(`h:${lx},${y1}`);
  }
  if (x1 === x2) {
    const ly = Math.min(y1, y2);
    return MAZE_PASSAGES.has(`v:${x1},${ly}`);
  }
  return false; // diagonal — never passable
}

/**
 * Returns the list of tiles directly connected to (x, y) through open maze passages.
 * Only orthogonal neighbours within map bounds are checked.
 */
export function getMazeNeighbors(x: number, y: number): PlayerPosition[] {
  const dirs: PlayerPosition[] = [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
  ];
  return dirs.filter(
    (p) =>
      p.x >= 0 && p.x < MAP_COLS &&
      p.y >= 0 && p.y < MAP_ROWS &&
      hasPassage(x, y, p.x, p.y)
  );
}

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
