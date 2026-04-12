// Static map data: 8x8 grid of biome types, biome info, and maze passage definitions.
// No logic — pure data only.

import type { BiomeType, BiomeInfo, MapBiomePreset } from '../types/map';
import type { PlayerPosition } from '../types/map';
import biomeIconsSprite1 from '../assets/spritesheet/1-32x32.png';
import biomeIconsSprite2 from '../assets/spritesheet/2-32x32.png';

/**
 * 8×8 world map grid. Indexed as MAP_GRID[row (y)][col (x)].
 *
 *   col: 0         1          2        3        4        5        6        7
 * row 0: mountain  mountain   forest   forest   forest   meadow   meadow   beach
 * row 1: mountain  lake       forest   forest   meadow   meadow   plains   beach
 * row 2: meadow    lake       meadow   meadow   plains   swamp    swamp    plains
 * row 3: plains    forest     forest   swamp    swamp    swamp    cave     plains
 * row 4: plains    plains     meadow   plains    beach    beach    plains   plains
 * row 5: forest    plains     plains   meadow   meadow   cave     mountain mountain
 * row 6: forest    forest     meadow   lake     lake     plains   plains   cave
 * row 7: beach     beach      plains   swamp    mountain cave     cave     treasure
 */
// prettier-ignore
export const MAP_GRID: BiomeType[][] = [
  ['mountain', 'mountain', 'forest',  'forest',  'forest',  'meadow',  'meadow',  'beach'],
  ['mountain', 'lake',     'forest',  'forest',  'meadow',  'meadow',  'plains',  'beach'],
  ['meadow',   'lake',     'meadow',  'meadow',  'plains',  'swamp',   'swamp',   'plains'],
  ['plains',   'forest',   'forest',  'swamp',   'swamp',   'swamp',   'cave',    'plains'],
  ['plains',   'plains',   'meadow',  'plains',  'beach',   'beach',   'plains',  'plains'],
  ['forest',   'plains',   'plains',  'meadow',  'meadow',  'cave',    'mountain', 'mountain'],
  ['forest',   'forest',   'meadow',  'lake',    'lake',    'plains',  'plains',  'cave'],
  ['beach',    'beach',    'plains',  'swamp',   'mountain', 'cave',   'cave',    'treasure'],
];

export const BIOME_ICON_SPRITES = {
  default: biomeIconsSprite1,
  secondary: biomeIconsSprite2,
} as const;
export const BIOME_ICON_SPRITE_SIZE = 32;
export const BIOME_ICON_SPRITE_COLUMNS = 16;

export const MAP_ROWS = MAP_GRID.length;
export const MAP_COLS = MAP_GRID[0].length;

export const INITIAL_PLAYER_POSITION: PlayerPosition = { x: 0, y: 0 }; // House moved to top-left
export const TREASURE_TILE = { x: 7, y: 7 };

const PRESET_BIOME_VARIANTS: Record<MapBiomePreset, BiomeType[]> = {
  meadow: ['meadow', 'plains', 'forest', 'swamp'],
  mountain: ['mountain', 'forest', 'plains', 'lake'],
  beach: ['beach', 'lake', 'swamp', 'plains'],
  desert: ['desert', 'plains', 'mountain', 'beach'],
  rock: ['rock', 'plains', 'mountain', 'desert'],
};

function pickRandomBiomeByPreset(preset: MapBiomePreset): BiomeType {
  const variants = PRESET_BIOME_VARIANTS[preset];
  if (Math.random() < 0.8) {
    return preset;
  }
  return variants[Math.floor(Math.random() * variants.length)]!;
}

/** Creates a randomized biome layout for each game session.
 *  Cave cells are kept fixed so enemy spawn logic and map theme stay consistent.
 */
export function createRandomizedMapGrid(
  baseGrid: BiomeType[][] = MAP_GRID,
  chaos = 0.2,
  presetBiome: MapBiomePreset = 'meadow',
): BiomeType[][] {
  const next = baseGrid.map((row) => [...row]);

  for (let y = 0; y < next.length; y += 1) {
    for (let x = 0; x < next[y]!.length; x += 1) {
      if (x === TREASURE_TILE.x && y === TREASURE_TILE.y) {
        next[y]![x] = 'treasure';
        continue;
      }

      if (next[y]![x] === 'cave') continue;
      if (x === INITIAL_PLAYER_POSITION.x && y === INITIAL_PLAYER_POSITION.y) {
        next[y]![x] = 'village';
        continue;
      }
      if (next[y]![x] === 'village') {
        next[y]![x] = pickRandomBiomeByPreset(presetBiome);
        continue;
      }

      if (Math.random() < chaos) {
        next[y]![x] = pickRandomBiomeByPreset(presetBiome);
      }
    }
  }

  return next;
}

// ── Maze passage definitions ──────────────────────────────────────────────────
//
// Passages are stored as a Set of canonical edge keys:
//   Horizontal: `h:${x},${y}` = open passage between (x,y) and (x+1,y)
//   Vertical:   `v:${x},${y}` = open passage between (x,y) and (x,y+1)
//
// Legacy maze data for when USE_MAZE_WALLS is true.

const USE_MAZE_WALLS = false;

export const MAZE_PASSAGES = new Set<string>([
  // Fill as needed when maze walls are enabled.
]);

/** Returns true if there is an open maze passage between the two orthogonally-adjacent tiles. */
export function hasPassage(x1: number, y1: number, x2: number, y2: number): boolean {
  if (!USE_MAZE_WALLS) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return dx + dy === 1;
  }

  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  if (dx + dy !== 1) return false;
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
    iconSpriteMatrix: [1, 15],
    iconSpriteSheet: 'secondary',
    texture: '/world-map/forest.svg',
    name: 'Forest',
    description: 'Dense woodland teeming with flora and hidden creatures.',
    categoryBonus: ['flora', 'creature'],
  },
  mountain: {
    type: 'mountain',
    emoji: '⛰️',
    iconSpriteMatrix: [1, 11],
    texture: '/world-map/mountain.svg',
    name: 'Mountain',
    description: 'Rocky peaks rich in rare minerals and crystals.',
    categoryBonus: ['mineral'],
    rarityBonus: [3],
  },
  lake: {
    type: 'lake',
    emoji: '🏞️',
    iconSpriteMatrix: [15, 2],
    texture: '/world-map/lake.svg',
    name: 'Lake',
    description: 'A serene lake where aquatic creatures thrive.',
    categoryBonus: ['creature', 'mineral'],
  },
  meadow: {
    type: 'meadow',
    emoji: '🌿',
    iconSpriteMatrix: [26, 9],
    texture: '/world-map/meadow.svg',
    name: 'Meadow',
    description: 'Open fields bursting with blooming flowers and insects.',
    categoryBonus: ['flora', 'creature'],
  },
  plains: {
    type: 'plains',
    emoji: '🌾',
    iconSpriteMatrix: [27, 15],
    texture: '/world-map/plains.svg',
    name: 'Plains',
    description: 'Balanced lands where all types of items may appear.',
    categoryBonus: [],
  },
  cave: {
    type: 'cave',
    emoji: '🕳️',
    iconSpriteMatrix: [1, 7],
    texture: '/world-map/cave.svg',
    name: 'Cave',
    description: 'Dark caverns hiding rare minerals and special finds.',
    categoryBonus: ['mineral', 'special'],
    rarityBonus: [3, 4],
  },
  treasure: {
    type: 'treasure',
    emoji: '📦',
    iconSpriteMatrix: [0, 5],
    texture: '/world-map/treasure.svg',
    name: 'Treasure Chest',
    description: 'A hidden chest at the edge of the map, keep an eye on this tile.',
    categoryBonus: [],
  },
  village: {
    type: 'village',
    emoji: '🏡',
    iconSpriteMatrix: [0, 15],
    texture: '/world-map/village.svg',
    name: 'Village',
    description: 'A cozy settlement. All common goods can be found here.',
    categoryBonus: [],
  },
  swamp: {
    type: 'swamp',
    emoji: '🌊',
    iconSpriteMatrix: [2, 13],
    texture: '/world-map/swamp.svg',
    name: 'Swamp',
    description: 'Murky wetlands with unusual flora and strange creatures.',
    categoryBonus: ['flora', 'creature'],
    rarityBonus: [2],
  },
  beach: {
    type: 'beach',
    emoji: '🏖️',
    iconSpriteMatrix: [1, 5],
    texture: '/world-map/beach.svg',
    name: 'Beach',
    description: 'Sandy shores where special and mineral finds wash ashore.',
    categoryBonus: ['special', 'mineral'],
  },
  desert: {
    type: 'desert',
    emoji: '🏜️',
    iconSpriteMatrix: [5, 12],
    texture: '/world-map/desert.svg',
    name: 'Desert',
    description: 'Dry heat and sharp winds create a harsh ecosystem.',
    categoryBonus: ['mineral', 'creature'],
    rarityBonus: [3],
  },
  rock: {
    type: 'rock',
    emoji: '🪨',
    iconSpriteMatrix: [1, 10],
    texture: '/world-map/rock.svg',
    name: 'Rock',
    description: 'Jagged stone fields with dense mineral veins and armored wildlife.',
    categoryBonus: ['mineral', 'creature', 'special'],
    rarityBonus: [4],
  },
  everywhere: {
    type: 'everywhere',
    emoji: '🌍',
    iconSpriteMatrix: [0, 0],
    texture: '/world-map/rock.svg',
    name: 'Everywhere',
    description: 'Can appear in any biome.',
    categoryBonus: [],
  },
};
