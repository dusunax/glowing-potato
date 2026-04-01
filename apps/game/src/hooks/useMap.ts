// Hook managing the player's position on the world map.
// Exposes position, movement helpers, fog-of-war visited tiles, and per-tile resource limits.

import { useState, useCallback, useMemo, useRef } from 'react';
import type { PlayerPosition } from '../types/map';
import {
  MAP_GRID, MAP_ROWS, MAP_COLS, INITIAL_PLAYER_POSITION, BIOME_INFO,
  getMazeNeighbors, hasPassage,
} from '../data/map';

/** Encode a position as a string key for Sets/Maps. */
export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

/** Random tile resource count: 1–3. */
function randomResources(): number {
  return Math.floor(Math.random() * 3) + 1;
}

/** Build the initial resource map: every tile gets 1–3 resources. */
function buildInitialResources(): Record<string, number> {
  const res: Record<string, number> = {};
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      res[tileKey(x, y)] = randomResources();
    }
  }
  return res;
}

export function useMap() {
  const [position, setPosition] = useState<PlayerPosition>(INITIAL_PLAYER_POSITION);

  // Fog of war: track which tiles the player has visited
  const [visitedTiles, setVisitedTiles] = useState<Set<string>>(
    () => new Set([tileKey(INITIAL_PLAYER_POSITION.x, INITIAL_PLAYER_POSITION.y)])
  );

  // Per-tile resource limits (1–3 per tile) — stored in a ref for synchronous reads
  // and shadowed in state to drive re-renders.
  const tileResourcesRef = useRef<Record<string, number>>(buildInitialResources());
  // The state counter exists solely to trigger re-renders when resources are consumed.
  const [, setTileResourcesVersion] = useState(0);

  /** BFS-based reachability: returns all tile keys reachable in ≤ maxSteps through maze passages. */
  const getReachableTiles = useCallback(
    (from: PlayerPosition, maxSteps: number): Set<string> => {
      const reachable = new Set<string>();
      const queue: Array<{ pos: PlayerPosition; steps: number }> = [{ pos: from, steps: 0 }];
      const seen = new Set<string>([tileKey(from.x, from.y)]);

      while (queue.length > 0) {
        const { pos, steps } = queue.shift()!;
        if (steps > 0) reachable.add(tileKey(pos.x, pos.y));
        if (steps < maxSteps) {
          for (const nb of getMazeNeighbors(pos.x, pos.y)) {
            const k = tileKey(nb.x, nb.y);
            if (!seen.has(k)) {
              seen.add(k);
              queue.push({ pos: nb, steps: steps + 1 });
            }
          }
        }
      }
      return reachable;
    },
    []
  );

  /** True if tile (x, y) can be reached within `range` maze steps from current position. */
  const canMoveTo = useCallback(
    (x: number, y: number, range = 1): boolean => {
      const reachable = getReachableTiles(position, range);
      return reachable.has(tileKey(x, y));
    },
    [position, getReachableTiles]
  );

  /** Returns whether there is a direct maze passage between current tile and (x,y). */
  const isAdjacent = useCallback(
    (x: number, y: number): boolean =>
      hasPassage(position.x, position.y, x, y),
    [position]
  );

  const moveTo = useCallback(
    (x: number, y: number): boolean => {
      if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return false;
      setPosition({ x, y });
      setVisitedTiles((prev) => {
        const next = new Set(prev);
        next.add(tileKey(x, y));
        return next;
      });
      return true;
    },
    []
  );

  /** Consumes one resource from tile (x, y). Returns the remaining count after consumption.
   *  Returns -1 if the tile was already depleted (0 remaining).
   *  Uses a ref for synchronous reads so multiple calls within the same render cycle work correctly. */
  const consumeTileResource = useCallback(
    (x: number, y: number): number => {
      const key = tileKey(x, y);
      const current = tileResourcesRef.current[key] ?? 0;
      if (current <= 0) return -1;
      const remaining = current - 1;
      tileResourcesRef.current = { ...tileResourcesRef.current, [key]: remaining };
      setTileResourcesVersion((v) => v + 1); // trigger re-render
      return remaining;
    },
    []
  );

  /** Returns the current resources remaining on tile (x, y). */
  const getTileResources = useCallback(
    (x: number, y: number): number => tileResourcesRef.current[tileKey(x, y)] ?? 0,
    []
  );

  const currentBiomeType = MAP_GRID[position.y][position.x];
  const currentBiomeInfo = BIOME_INFO[currentBiomeType];

  /** Tiles the player hasn't visited but knows exist (adjacent to visited via passages). */
  const knownTiles = useMemo(() => {
    const known = new Set<string>();
    for (const key of visitedTiles) {
      const [xs, ys] = key.split(',');
      const x = Number(xs), y = Number(ys);
      for (const nb of getMazeNeighbors(x, y)) {
        const nk = tileKey(nb.x, nb.y);
        if (!visitedTiles.has(nk)) known.add(nk);
      }
    }
    return known;
  }, [visitedTiles]);

  return {
    position,
    currentBiomeType,
    currentBiomeInfo,
    visitedTiles,
    knownTiles,
    canMoveTo,
    isAdjacent,
    moveTo,
    consumeTileResource,
    getTileResources,
    getReachableTiles,
    MAP_ROWS,
    MAP_COLS,
  };
}
