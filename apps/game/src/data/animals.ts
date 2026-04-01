// Static animal definitions and initial placement.
// No logic — pure data only.

import type { AnimalTemplate, WildAnimal } from '../types/animal';

export const ANIMAL_TEMPLATES: AnimalTemplate[] = [
  { name: 'Wolf',      emoji: '🐺', behavior: 'hostile', maxHp: 5, attack: 2 },
  { name: 'Bear',      emoji: '🐻', behavior: 'hostile', maxHp: 8, attack: 3 },
  { name: 'Wild Boar', emoji: '🐗', behavior: 'hostile', maxHp: 6, attack: 2 },
  { name: 'Deer',      emoji: '🦌', behavior: 'neutral', maxHp: 4, attack: 0 },
  { name: 'Rabbit',    emoji: '🐇', behavior: 'neutral', maxHp: 2, attack: 0 },
  { name: 'Fox',       emoji: '🦊', behavior: 'neutral', maxHp: 3, attack: 0 },
];

/** Initial placement: scattered around the map, not at village (0,2). */
const INITIAL_PLACEMENTS: Array<{ templateIndex: number; x: number; y: number }> = [
  { templateIndex: 0, x: 2, y: 0 }, // Wolf  → forest
  { templateIndex: 1, x: 0, y: 0 }, // Bear  → mountain
  { templateIndex: 2, x: 3, y: 3 }, // Boar  → swamp
  { templateIndex: 3, x: 3, y: 1 }, // Deer  → meadow
  { templateIndex: 4, x: 2, y: 3 }, // Rabbit→ meadow
  { templateIndex: 5, x: 4, y: 2 }, // Fox   → plains
];

let _counter = 0;

export function createInitialAnimals(): WildAnimal[] {
  return INITIAL_PLACEMENTS.map(({ templateIndex, x, y }) => {
    const t = ANIMAL_TEMPLATES[templateIndex]!;
    return {
      ...t,
      id: `animal_${++_counter}`,
      position: { x, y },
      hp: t.maxHp,
      alive: true,
    };
  });
}
