// Static animal definitions and initial placement.
// No logic — pure data only.

import type { BiomeType, MapBiomePreset, PlayerPosition } from '../types/map';
import type { AnimalTemplate, WildAnimal } from '../types/animal';
import { MAP_GRID, MAP_COLS, MAP_ROWS, getMazeNeighbors } from './map';

const ANIMAL_TEMPLATES = {
  wolf: { name: 'Wolf',      emoji: '🐺', behavior: 'hostile', maxHp: 4, attack: 3, rarity: 2, experienceReward: 4 },
  bear: { name: 'Bear',      emoji: '🐻', behavior: 'hostile', maxHp: 7, attack: 5, rarity: 3, experienceReward: 8 },
  wildBoar: { name: 'Wild Boar', emoji: '🐗', behavior: 'hostile', maxHp: 5, attack: 3, rarity: 3, experienceReward: 6 },
  deer: { name: 'Deer',      emoji: '🦌', behavior: 'neutral', maxHp: 4, attack: 0, rarity: 1, experienceReward: 1 },
  rabbit: { name: 'Rabbit',    emoji: '🐇', behavior: 'neutral', maxHp: 2, attack: 0, rarity: 1, experienceReward: 1 },
  fox: { name: 'Fox', emoji: '🦊', behavior: 'neutral', maxHp: 3, attack: 0, rarity: 1, experienceReward: 2 },
  owl: { name: 'Owl', emoji: '🦉', behavior: 'neutral', maxHp: 2, attack: 0, rarity: 1, experienceReward: 2 },
  stoneCrawler: { name: 'Stone Crawler', emoji: '🦂', behavior: 'hostile', maxHp: 7, attack: 4, rarity: 4, experienceReward: 10 },
  rockCrawler: { name: 'Rock Crawler', emoji: '🪨', behavior: 'hostile', maxHp: 6, attack: 5, rarity: 4, experienceReward: 10 },
  skeleton: { name: 'Skeleton', emoji: '💀', behavior: 'hostile', maxHp: 12, attack: 7, rarity: 5, experienceReward: 18 },
  bloodSkeleton: {
    name: 'Blood Skeleton',
    emoji: '🩸',
    behavior: 'hostile',
    maxHp: 16,
    attack: 12,
    rarity: 5,
    experienceReward: 24,
  },
} satisfies Record<string, AnimalTemplate>;

type WeightedTemplate = {
  template: AnimalTemplate;
  weight: number;
};

const BIOME_ANIMAL_POOLS: Record<MapBiomePreset, WeightedTemplate[]> = {
  meadow: [
    { template: ANIMAL_TEMPLATES.rabbit, weight: 5 },
    { template: ANIMAL_TEMPLATES.fox, weight: 4 },
    { template: ANIMAL_TEMPLATES.deer, weight: 4 },
    { template: ANIMAL_TEMPLATES.wolf, weight: 3 },
    { template: ANIMAL_TEMPLATES.wildBoar, weight: 2 },
    { template: ANIMAL_TEMPLATES.bear, weight: 1 },
  ],
  mountain: [
    { template: ANIMAL_TEMPLATES.fox, weight: 3 },
    { template: ANIMAL_TEMPLATES.deer, weight: 3 },
    { template: ANIMAL_TEMPLATES.wolf, weight: 4 },
    { template: ANIMAL_TEMPLATES.wildBoar, weight: 3 },
    { template: ANIMAL_TEMPLATES.bear, weight: 2 },
    { template: ANIMAL_TEMPLATES.rabbit, weight: 3 },
  ],
  beach: [
    { template: ANIMAL_TEMPLATES.fox, weight: 2 },
    { template: ANIMAL_TEMPLATES.wolf, weight: 4 },
    { template: ANIMAL_TEMPLATES.deer, weight: 2 },
    { template: ANIMAL_TEMPLATES.wildBoar, weight: 5 },
    { template: ANIMAL_TEMPLATES.bear, weight: 4 },
    { template: ANIMAL_TEMPLATES.rabbit, weight: 1 },
  ],
  desert: [
    { template: ANIMAL_TEMPLATES.wolf, weight: 5 },
    { template: ANIMAL_TEMPLATES.bear, weight: 5 },
    { template: ANIMAL_TEMPLATES.wildBoar, weight: 6 },
    { template: ANIMAL_TEMPLATES.deer, weight: 1 },
    { template: ANIMAL_TEMPLATES.fox, weight: 2 },
    { template: ANIMAL_TEMPLATES.rabbit, weight: 1 },
  ],
  rock: [
    { template: ANIMAL_TEMPLATES.stoneCrawler, weight: 4 },
    { template: ANIMAL_TEMPLATES.rockCrawler, weight: 3 },
    { template: ANIMAL_TEMPLATES.wolf, weight: 3 },
    { template: ANIMAL_TEMPLATES.wildBoar, weight: 2 },
    { template: ANIMAL_TEMPLATES.bear, weight: 2 },
    { template: ANIMAL_TEMPLATES.deer, weight: 2 },
    { template: ANIMAL_TEMPLATES.owl, weight: 1 },
  ],
};

const BIOME_DIFFICULTY: Record<MapBiomePreset, { hpMultiplier: number; attackMultiplier: number }> = {
  meadow: { hpMultiplier: 0.8, attackMultiplier: 0.8 },
  mountain: { hpMultiplier: 1.0, attackMultiplier: 1.0 },
  beach: { hpMultiplier: 1.2, attackMultiplier: 1.2 },
  desert: { hpMultiplier: 1.5, attackMultiplier: 1.5 },
  rock: { hpMultiplier: 2.0, attackMultiplier: 2.0 },
};

const HOSTILE_ATTACK_WEAKNESS = 0.9;
const HOSTILE_HP_WEAKNESS = 0.95;

type PositionSetLike = Iterable<{ x: number; y: number }>;

type SpawnedPosition = { x: number; y: number };

function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

function toPositionSet(positions: PositionSetLike = []): Set<string> {
  const keySet = new Set<string>();
  for (const pos of positions) {
    keySet.add(tileKey(pos.x, pos.y));
  }
  return keySet;
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function pickSpawnPositions(
  caveTiles: Array<{ x: number; y: number }> = CAVE_TILES,
  count: number,
  occupied: Set<string> = new Set(),
  playerPosition?: PlayerPosition,
): SpawnedPosition[] {
  const source = caveTiles.length > 0 ? [...caveTiles] : [...CAVE_TILES];
  const caveSet = new Set(source.map((tile) => tileKey(tile.x, tile.y)));
  const playerTile = playerPosition ? tileKey(playerPosition.x, playerPosition.y) : null;

  const available = shuffleInPlace(source).filter((tile) => {
    const key = tileKey(tile.x, tile.y);
    if (occupied.has(key)) return false;
    if (playerTile && caveSet.has(playerTile) && key === playerTile) return false;
    return true;
  });

  if (available.length === 0 || count <= 0) return [];

  if (!playerTile || !playerPosition || !caveSet.has(playerTile)) {
    const safeCount = Math.min(count, available.length);
    return available.slice(0, safeCount);
  }

  const adjacentNeighbors = new Set(
    getMazeNeighbors(playerPosition.x, playerPosition.y)
      .filter((tile) => caveSet.has(tileKey(tile.x, tile.y)))
      .map((tile) => tileKey(tile.x, tile.y)),
  );
  const adjacent = shuffleInPlace(available.filter((tile) => adjacentNeighbors.has(tileKey(tile.x, tile.y))));
  const selected = [...adjacent.slice(0, Math.min(count, adjacent.length))];
  const used = new Set(selected.map((tile) => tileKey(tile.x, tile.y)));

  for (const tile of available) {
    if (selected.length >= count) break;
    const key = tileKey(tile.x, tile.y);
    if (used.has(key)) continue;
    selected.push(tile);
    used.add(key);
  }

  const safeCount = Math.min(count, selected.length);
  return selected.slice(0, safeCount);
}

function scaleTemplateForBiome(template: AnimalTemplate, biomePreset: MapBiomePreset): AnimalTemplate {
  const multiplier = BIOME_DIFFICULTY[biomePreset];
  const isHostile = template.behavior === 'hostile';
  const hpMultiplier = isHostile ? multiplier.hpMultiplier * HOSTILE_HP_WEAKNESS : multiplier.hpMultiplier;
  const attackMultiplier = isHostile
    ? multiplier.attackMultiplier * HOSTILE_ATTACK_WEAKNESS
    : multiplier.attackMultiplier;

  return {
    ...template,
    maxHp: Math.max(1, Math.round(template.maxHp * hpMultiplier)),
    attack: Math.max(0, Math.round(template.attack * attackMultiplier)),
  };
}

function createTemplateFromPool(pool: WeightedTemplate[], biome: MapBiomePreset): AnimalTemplate {
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  const pick = Math.random() * totalWeight;
  let accum = 0;
  let selected = pool[0]!.template;
  for (const entry of pool) {
    accum += entry.weight;
    if (pick < accum) {
      selected = entry.template;
      break;
    }
  }

  return scaleTemplateForBiome(selected, biome);
}

function getHostilePoolByBiome(biomePreset: MapBiomePreset): WeightedTemplate[] {
  return (BIOME_ANIMAL_POOLS[biomePreset] ?? BIOME_ANIMAL_POOLS.meadow).filter(
    (entry) => entry.template.behavior === 'hostile',
  );
}

function createTemplateFromRandomHostileTemplate(biomePreset: MapBiomePreset): AnimalTemplate {
  const hostilePool = getHostilePoolByBiome(biomePreset);
  if (hostilePool.length > 0) {
    return createTemplateFromPool(hostilePool, biomePreset);
  }
  return createTemplateFromPool(BIOME_ANIMAL_POOLS.meadow, biomePreset);
}

export const CAVE_TILES = (() => {
  const tiles: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < MAP_ROWS; y += 1) {
    for (let x = 0; x < MAP_COLS; x += 1) {
      if (MAP_GRID[y]![x] === 'cave') {
        tiles.push({ x, y });
      }
    }
  }

  return tiles;
})();

export function getCaveTiles(mapGrid: BiomeType[][] = MAP_GRID): Array<{ x: number; y: number }> {
  const tiles: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < mapGrid.length; y += 1) {
    for (let x = 0; x < mapGrid[y]!.length; x += 1) {
      if (mapGrid[y]![x] === 'cave') tiles.push({ x, y });
    }
  }
  return tiles;
}

let _counter = 0;

function spawnWave(
  caveTiles: Array<{ x: number; y: number }> = CAVE_TILES,
  biomePreset: MapBiomePreset = 'meadow',
  occupied: PositionSetLike = [],
  forcedTemplate?: AnimalTemplate,
  forcedCount?: number,
  playerPosition?: PlayerPosition,
): WildAnimal[] {
  const count = forcedCount == null ? (Math.random() < 0.5 ? 1 : 2) : Math.max(0, Math.floor(forcedCount));
  const occupiedSet = toPositionSet(occupied);
  const positions = pickSpawnPositions(caveTiles, count, occupiedSet, playerPosition);
  return positions.map((position) => {
    const pool = BIOME_ANIMAL_POOLS[biomePreset] ?? BIOME_ANIMAL_POOLS.meadow;
    const template = forcedTemplate ?? createTemplateFromPool(pool, biomePreset);
    const t = forcedTemplate ? scaleTemplateForBiome(forcedTemplate, biomePreset) : template;
    const id = `animal_${++_counter}`;
    return {
      ...t,
      id,
      position,
      hp: t.maxHp,
      alive: true,
    };
  });
}

/** Spawn 1–2 animals for the initial state. */
export function createInitialAnimals(
  caveTiles: Array<{ x: number; y: number }> = CAVE_TILES,
  biomePreset: MapBiomePreset = 'meadow',
): WildAnimal[] {
  return spawnWave(caveTiles, biomePreset, []);
}

/** Spawn 1–2 replacement animals (called when all are defeated). */
export function spawnNewWave(
  caveTiles: Array<{ x: number; y: number }> = CAVE_TILES,
  biomePreset: MapBiomePreset = 'meadow',
  occupied: PositionSetLike = [],
  forcedTemplate?: AnimalTemplate,
  forcedCount?: number,
  playerPosition?: PlayerPosition,
): WildAnimal[] {
  return spawnWave(caveTiles, biomePreset, occupied, forcedTemplate, forcedCount, playerPosition);
}

export {
  ANIMAL_TEMPLATES,
  createTemplateFromRandomHostileTemplate,
};
