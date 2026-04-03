// Static map data: 8x8 grid of biome types, biome info, and maze passage definitions.
// No logic — pure data only.
/**
 * 8×8 world map grid. Indexed as MAP_GRID[row (y)][col (x)].
 *
 *   col: 0         1          2        3        4        5        6        7
 * row 0: mountain  mountain   forest   forest   forest   meadow   meadow   beach
 * row 1: mountain  lake       forest   forest   meadow   meadow   plains   beach
 * row 2: village   lake       meadow   meadow   plains   swamp    swamp    plains
 * row 3: plains    forest     forest   swamp    swamp    swamp    cave     plains
 * row 4: plains    plains     meadow   plains    beach    beach    plains   plains
 * row 5: forest    plains     plains   meadow   meadow   cave     mountain mountain
 * row 6: forest    forest     meadow   lake     lake     plains   plains   cave
 * row 7: beach     beach      plains   swamp    mountain cave     cave     cave
 */
// prettier-ignore
export const MAP_GRID = [
    ['mountain', 'mountain', 'forest', 'forest', 'forest', 'meadow', 'meadow', 'beach'],
    ['mountain', 'lake', 'forest', 'forest', 'meadow', 'meadow', 'plains', 'beach'],
    ['village', 'lake', 'meadow', 'meadow', 'plains', 'swamp', 'swamp', 'plains'],
    ['plains', 'forest', 'forest', 'swamp', 'swamp', 'swamp', 'cave', 'plains'],
    ['plains', 'plains', 'meadow', 'plains', 'beach', 'beach', 'plains', 'plains'],
    ['forest', 'plains', 'plains', 'meadow', 'meadow', 'cave', 'mountain', 'mountain'],
    ['forest', 'forest', 'meadow', 'lake', 'lake', 'plains', 'plains', 'cave'],
    ['beach', 'beach', 'plains', 'swamp', 'mountain', 'cave', 'cave', 'cave'],
];
export const MAP_ROWS = MAP_GRID.length;
export const MAP_COLS = MAP_GRID[0].length;
export const INITIAL_PLAYER_POSITION = { x: 0, y: 2 }; // Village
// ── Maze passage definitions ──────────────────────────────────────────────────
//
// Passages are stored as a Set of canonical edge keys:
//   Horizontal: `h:${x},${y}` = open passage between (x,y) and (x+1,y)
//   Vertical:   `v:${x},${y}` = open passage between (x,y) and (x,y+1)
//
// Legacy maze data for when USE_MAZE_WALLS is true.
const USE_MAZE_WALLS = false;
export const MAZE_PASSAGES = new Set([
// Fill as needed when maze walls are enabled.
]);
/** Returns true if there is an open maze passage between the two orthogonally-adjacent tiles. */
export function hasPassage(x1, y1, x2, y2) {
    if (!USE_MAZE_WALLS) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return dx + dy === 1;
    }
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    if (dx + dy !== 1)
        return false;
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
export function getMazeNeighbors(x, y) {
    const dirs = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
    ];
    return dirs.filter((p) => p.x >= 0 && p.x < MAP_COLS &&
        p.y >= 0 && p.y < MAP_ROWS &&
        hasPassage(x, y, p.x, p.y));
}
export const BIOME_INFO = {
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
