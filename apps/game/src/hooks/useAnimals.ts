// Hook managing wild animals: state, AI movement, and combat.

import { useState, useCallback, useRef } from 'react';
import type { AnimalTemplate, WildAnimal } from '../types/animal';
import type { PlayerPosition, MapBiomePreset } from '../types/map';
import { createInitialAnimals, spawnNewWave } from '../data/animals';
import { getMazeNeighbors, MAP_COLS, MAP_ROWS } from '../data/map';
import { tileKey } from './useMap';

const BASE_PLAYER_ATTACK_DAMAGE = 3;
type PlayerAttackDamageCalculator = () => number;

/** BFS shortest path from `from` to `to` through the maze. Returns next step or null. */
function nextStepToward(from: PlayerPosition, to: PlayerPosition): PlayerPosition | null {
  if (from.x === to.x && from.y === to.y) return null;
  const queue: Array<{ pos: PlayerPosition; path: PlayerPosition[] }> = [
    { pos: from, path: [] },
  ];
  const seen = new Set<string>([tileKey(from.x, from.y)]);

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    for (const nb of getMazeNeighbors(pos.x, pos.y)) {
      const k = tileKey(nb.x, nb.y);
      if (seen.has(k)) continue;
      seen.add(k);
      const newPath = [...path, nb];
      if (nb.x === to.x && nb.y === to.y) {
        return newPath[0] ?? null; // first step toward target
      }
      queue.push({ pos: nb, path: newPath });
    }
  }
  return null; // unreachable
}

/** Returns a random adjacent tile (via maze passages). Falls back to current if no exits. */
function randomStep(pos: PlayerPosition): PlayerPosition {
  const neighbors = getMazeNeighbors(pos.x, pos.y);
  if (neighbors.length === 0) return pos;
  return neighbors[Math.floor(Math.random() * neighbors.length)]!;
}

/** Move one step away from the player. */
function stepAwayFrom(pos: PlayerPosition, player: PlayerPosition): PlayerPosition {
  const neighbors = getMazeNeighbors(pos.x, pos.y);
  if (neighbors.length === 0) return pos;
  const farthest = neighbors.reduce((best, nb) => {
    const bestDist = Math.abs(best.x - player.x) + Math.abs(best.y - player.y);
    const nbDist = Math.abs(nb.x - player.x) + Math.abs(nb.y - player.y);
    return nbDist > bestDist ? nb : best;
  });
  return farthest;
}

export function useAnimals(
  caveTiles: Array<{ x: number; y: number }> = [],
  biomePreset: MapBiomePreset = 'meadow',
  getPlayerAttackDamage: PlayerAttackDamageCalculator = () => BASE_PLAYER_ATTACK_DAMAGE,
) {
  const animalsRef = useRef<WildAnimal[]>([]);
  const safeCaveTiles = caveTiles.length > 0 ? caveTiles : [];
  const [animals, setAnimals] = useState<WildAnimal[]>(() => {
    const initial = createInitialAnimals(safeCaveTiles, biomePreset);
    animalsRef.current = initial;
    return initial;
  });

  /** Move all alive animals one step (called when the player moves). */
  const moveAnimals = useCallback((playerPosition: PlayerPosition) => {
    const current = animalsRef.current;
    const occupied = new Set<string>(current.filter((a) => a.alive).map((a) => tileKey(a.position.x, a.position.y)));
    const moved = current.map((a) => {
      if (!a.alive) return a;

      occupied.delete(tileKey(a.position.x, a.position.y));

      let next: PlayerPosition;
      if (a.behavior === 'hostile') {
        const step = nextStepToward(a.position, playerPosition);
        if (step && (step.x !== playerPosition.x || step.y !== playerPosition.y)) {
          if (!occupied.has(tileKey(step.x, step.y))) {
            next = step;
          } else {
            next = a.position;
          }
        } else {
          next = a.position;
        }
      } else {
        const px = Math.abs(a.position.x - playerPosition.x);
        const py = Math.abs(a.position.y - playerPosition.y);
        if (px + py <= 1) {
          next = stepAwayFrom(a.position, playerPosition);
        } else {
          next = Math.random() < 0.4 ? randomStep(a.position) : a.position;
        }
        if (next.x === playerPosition.x && next.y === playerPosition.y) {
          next = a.position;
        }
        if (occupied.has(tileKey(next.x, next.y))) {
          next = a.position;
        }
      }

      if (next.x === playerPosition.x && next.y === playerPosition.y) {
        next = a.position;
      }

      occupied.add(tileKey(next.x, next.y));

      return { ...a, position: next };
    });

    const occupiedAfterMove = moved.filter((a) => a.alive).map((a) => a.position);
    const nextAnimals = moved.every((a) => !a.alive)
      ? spawnNewWave(safeCaveTiles, biomePreset, occupiedAfterMove)
      : moved;
    animalsRef.current = nextAnimals;
    setAnimals(nextAnimals);
    return nextAnimals;
  }, [safeCaveTiles, biomePreset]);

type AttackResult = {
  message: string;
  defeated: boolean;
  hit: boolean;
  animalId: string;
  animalName: string;
  animalEmoji: string;
  animalRarity: WildAnimal['rarity'];
  experience: number;
};

  /** Spawn a cave wave on schedule (1–2 new animals in cave tiles). */
  const spawnCaveWave = useCallback((forcedTemplate?: AnimalTemplate): WildAnimal[] => {
    const current = animalsRef.current;
    const occupied = current
      .filter((a) => a.alive)
      .map((a) => a.position);
    const spawnFromCave = spawnNewWave(safeCaveTiles, biomePreset, occupied, forcedTemplate);
    const nextAnimals = current.every((a) => !a.alive)
      ? spawnFromCave
      : [...current.filter((a) => a.alive), ...spawnFromCave];
    animalsRef.current = nextAnimals;
    setAnimals(nextAnimals);
    return nextAnimals;
  }, [safeCaveTiles, biomePreset]);

  /** Spawn custom cave wave templates as separate one-by-one monsters. */
  const spawnCaveWaveWithTemplates = useCallback((templates: AnimalTemplate[]) => {
    const current = animalsRef.current;
    if (templates.length === 0) return current;
    const shouldReplaceWithSpawn = current.every((a) => !a.alive);
    let nextAnimals: WildAnimal[] = shouldReplaceWithSpawn ? [] : current.filter((a) => a.alive);
    let occupied = nextAnimals.map((a) => a.position);

    templates.forEach((template) => {
      const spawnFromCave = spawnNewWave(safeCaveTiles, biomePreset, occupied, template, 1);
      nextAnimals = [...nextAnimals, ...spawnFromCave];
      occupied = [...occupied, ...spawnFromCave.map((a) => a.position)];
    });

    animalsRef.current = nextAnimals;
    setAnimals(nextAnimals);
    return nextAnimals;
  }, [safeCaveTiles, biomePreset]);

/** Player attacks an animal by id. Returns event message. */
  const attackAnimal = useCallback((animalId: string): AttackResult => {
    const target = animalsRef.current.find((a) => a.id === animalId && a.alive);
    if (!target) {
    return {
      message: '',
      defeated: false,
      hit: false,
      animalId,
      animalName: '',
      animalEmoji: '',
      animalRarity: 1,
      experience: 0,
    };
  }

    const attackDamage = Math.max(1, getPlayerAttackDamage());
    const nextHp = target.hp - attackDamage;
    const nextAlive = nextHp > 0;
    const message = nextAlive
      ? `You hit ${target.name} ${target.emoji} for ${attackDamage} damage! (${nextHp}/${target.maxHp} HP)`
      : `You defeated the ${target.name} ${target.emoji}!`;

    const updated = animalsRef.current.map((a) => {
      if (a.id !== animalId || !a.alive) return a;
      return { ...a, hp: Math.max(nextHp, 0), alive: nextAlive };
    });
    const occupied = updated
      .filter((a) => a.alive)
      .map((a) => a.position);
    const nextAnimals = updated.every((a) => !a.alive)
      ? spawnNewWave(safeCaveTiles, biomePreset, occupied)
      : updated;
    animalsRef.current = nextAnimals;
    setAnimals(nextAnimals);

    return {
      message,
      defeated: !nextAlive,
      hit: true,
      animalId,
      animalName: target.name,
      animalEmoji: target.emoji,
      animalRarity: target.rarity ?? 1,
      experience: target.experienceReward,
    };
  }, [safeCaveTiles, biomePreset, getPlayerAttackDamage]);

  /** Returns all alive animals at the given tile. */
  const getAnimalsAt = useCallback(
    (x: number, y: number): WildAnimal[] =>
      animalsRef.current.filter((a) => a.alive && a.position.x === x && a.position.y === y),
    []
  );

  /** Returns alive hostile animals that are directly adjacent to the player (maze neighbours). */
  const getAdjacentHostile = useCallback(
    (playerPos: PlayerPosition): WildAnimal[] => {
      return animalsRef.current.filter((a) => {
        if (!a.alive || a.behavior !== 'hostile') return false;
        const px = Math.abs(a.position.x - playerPos.x);
        const py = Math.abs(a.position.y - playerPos.y);
        return px + py === 1; // Orthogonal only (cardinal direction)
      });
    },
    []
  );

  /** Returns ALL alive animals directly around the player (orthogonal + diagonal). */
  const getAdjacentAnimals = useCallback(
    (playerPos: PlayerPosition): WildAnimal[] => {
      return animalsRef.current.filter((a) => {
        if (!a.alive) return false;
        const px = Math.abs(a.position.x - playerPos.x);
        const py = Math.abs(a.position.y - playerPos.y);
        return px <= 1 && py <= 1 && (px + py > 0);
      });
    },
    []
  );

  return {
    animals,
    moveAnimals,
    spawnCaveWave,
    spawnCaveWaveWithTemplates,
    attackAnimal,
    getAnimalsAt,
    getAdjacentHostile,
    getAdjacentAnimals,
  };
}

// Re-export to avoid importing from useMap in consumers
export { MAP_COLS, MAP_ROWS };
