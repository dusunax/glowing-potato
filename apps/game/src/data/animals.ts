// Static animal definitions and initial placement.
// No logic — pure data only.

import type { AnimalTemplate, WildAnimal } from '../types/animal';
import { MAP_GRID, MAP_COLS, MAP_ROWS } from './map';

export const ANIMAL_TEMPLATES: AnimalTemplate[] = [
  { name: 'Wolf',      emoji: '🐺', behavior: 'hostile', maxHp: 5, attack: 4 },
  { name: 'Bear',      emoji: '🐻', behavior: 'hostile', maxHp: 8, attack: 5 },
  { name: 'Wild Boar', emoji: '🐗', behavior: 'hostile', maxHp: 6, attack: 4 },
  { name: 'Deer',      emoji: '🦌', behavior: 'neutral', maxHp: 4, attack: 0 },
  { name: 'Rabbit',    emoji: '🐇', behavior: 'neutral', maxHp: 2, attack: 0 },
  { name: 'Fox',       emoji: '🦊', behavior: 'neutral', maxHp: 3, attack: 0 },
];

const CAVE_TILES = (() => {
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

let _counter = 0;

function randomTile(): { x: number; y: number } {
  if (CAVE_TILES.length > 0) {
    return CAVE_TILES[Math.floor(Math.random() * CAVE_TILES.length)]!;
  }

  const x = Math.floor(Math.random() * MAP_COLS);
  const y = Math.floor(Math.random() * MAP_ROWS);
  return { x, y };
}

function spawnAnimal(): WildAnimal {
  const t = ANIMAL_TEMPLATES[Math.floor(Math.random() * ANIMAL_TEMPLATES.length)]!;
  return {
    ...t,
    id: `animal_${++_counter}`,
    position: randomTile(),
    hp: t.maxHp,
    alive: true,
  };
}

/** Spawn 1–2 animals for the initial state. */
export function createInitialAnimals(): WildAnimal[] {
  const count = Math.random() < 0.5 ? 1 : 2;
  return Array.from({ length: count }, spawnAnimal);
}

/** Spawn 1–2 replacement animals (called when all are defeated). */
export function spawnNewWave(): WildAnimal[] {
  const count = Math.random() < 0.5 ? 1 : 2;
  return Array.from({ length: count }, spawnAnimal);
}
