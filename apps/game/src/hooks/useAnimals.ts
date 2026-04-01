// Hook managing wild animals: state, AI movement, and combat.

import { useState, useCallback } from 'react';
import type { WildAnimal } from '../types/animal';
import type { PlayerPosition } from '../types/map';
import { createInitialAnimals } from '../data/animals';
import { getMazeNeighbors, MAP_COLS, MAP_ROWS } from '../data/map';
import { tileKey } from './useMap';

const PLAYER_ATTACK_DAMAGE = 3;

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

export function useAnimals() {
  const [animals, setAnimals] = useState<WildAnimal[]>(createInitialAnimals);

  /** Move all alive animals one step (called when the player moves). */
  const moveAnimals = useCallback((playerPosition: PlayerPosition) => {
    setAnimals((prev) =>
      prev.map((a) => {
        if (!a.alive) return a;

        let next: PlayerPosition;
        if (a.behavior === 'hostile') {
          // Chase the player
          const step = nextStepToward(a.position, playerPosition);
          next = step ?? a.position;
        } else {
          // Neutral: flee if player is adjacent, otherwise wander randomly
          const px = Math.abs(a.position.x - playerPosition.x);
          const py = Math.abs(a.position.y - playerPosition.y);
          if (px + py <= 1) {
            next = stepAwayFrom(a.position, playerPosition);
          } else {
            // 40% chance to move, 60% stay still
            next = Math.random() < 0.4 ? randomStep(a.position) : a.position;
          }
        }

        return { ...a, position: next };
      })
    );
  }, []);

  /** Player attacks an animal by id. Returns event message. */
  const attackAnimal = useCallback((animalId: string): string => {
    let msg = '';
    setAnimals((prev) =>
      prev.map((a) => {
        if (a.id !== animalId || !a.alive) return a;
        const newHp = a.hp - PLAYER_ATTACK_DAMAGE;
        if (newHp <= 0) {
          msg = `You defeated the ${a.name} ${a.emoji}!`;
          return { ...a, hp: 0, alive: false };
        }
        msg = `You hit ${a.name} ${a.emoji} for ${PLAYER_ATTACK_DAMAGE} damage! (${newHp}/${a.maxHp} HP)`;
        return { ...a, hp: newHp };
      })
    );
    return msg;
  }, []);

  /** Returns all alive animals at the given tile. */
  const getAnimalsAt = useCallback(
    (x: number, y: number): WildAnimal[] =>
      animals.filter((a) => a.alive && a.position.x === x && a.position.y === y),
    [animals]
  );

  /** Returns alive hostile animals that are directly adjacent to the player (maze neighbours). */
  const getAdjacentHostile = useCallback(
    (playerPos: PlayerPosition): WildAnimal[] => {
      return animals.filter((a) => {
        if (!a.alive || a.behavior !== 'hostile') return false;
        const px = Math.abs(a.position.x - playerPos.x);
        const py = Math.abs(a.position.y - playerPos.y);
        return px + py === 1; // Manhattan distance 1 (orthogonally adjacent)
      });
    },
    [animals]
  );

  /** Returns ALL alive animals directly adjacent to the player. */
  const getAdjacentAnimals = useCallback(
    (playerPos: PlayerPosition): WildAnimal[] => {
      return animals.filter((a) => {
        if (!a.alive) return false;
        const px = Math.abs(a.position.x - playerPos.x);
        const py = Math.abs(a.position.y - playerPos.y);
        return px + py === 1;
      });
    },
    [animals]
  );

  return {
    animals,
    moveAnimals,
    attackAnimal,
    getAnimalsAt,
    getAdjacentHostile,
    getAdjacentAnimals,
  };
}

// Re-export to avoid importing from useMap in consumers
export { MAP_COLS, MAP_ROWS };
