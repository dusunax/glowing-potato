// Hook managing the player's position on the world map.
// Exposes position, movement helpers, fog-of-war visited tiles, and per-tile resource limits.

import { useState, useCallback, useMemo, useRef } from 'react';
import type { BiomeType, PlayerPosition, MapBiomePreset } from '../types/map';
import {
  MAP_GRID, MAP_ROWS, MAP_COLS, INITIAL_PLAYER_POSITION, BIOME_INFO,
  createRandomizedMapGrid,
  getMazeNeighbors, hasPassage,
} from '../data/map';

/** Encode a position as a string key for Sets/Maps. */
export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

/** Random tile resource count: 1–3 (village is forced to 5). */
function randomResources(): number {
  return Math.floor(Math.random() * 3) + 1;
}

function getInitialResourcesForTile(biomeType: string): number {
  if (biomeType === 'village') {
    return 5;
  }
  return randomResources();
}

/** Build the initial resource map: every tile gets 1–10 resources. */
function buildInitialResources(mapGrid: BiomeType[][]): Record<string, number> {
  const res: Record<string, number> = {};
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      res[tileKey(x, y)] = getInitialResourcesForTile(mapGrid[y]![x]);
    }
  }
  return res;
}

export function useMap(startBiomePreset: MapBiomePreset = 'meadow') {
  const [mapGrid] = useState(() => createRandomizedMapGrid(MAP_GRID, 0.2, startBiomePreset));
  const [position, setPosition] = useState<PlayerPosition>(INITIAL_PLAYER_POSITION);

  const caveTiles = useMemo(
    () =>
      mapGrid.reduce<Array<{ x: number; y: number }>>((acc, row, y) =>
        row.reduce<Array<{ x: number; y: number }>>((a, biome, x) => {
          if (biome === 'cave') a.push({ x, y });
          return a;
        }, acc),
      []),
    [mapGrid]
  );

  // Fog of war: track which tiles the player has visited
  const [visitedTiles, setVisitedTiles] = useState<Set<string>>(
    () => new Set([tileKey(INITIAL_PLAYER_POSITION.x, INITIAL_PLAYER_POSITION.y)])
  );

  // Resource caps are fixed per tile (1–3 per tile), and current resources are tracked separately.
  const tileResourceCapsRef = useRef<Record<string, number>>(buildInitialResources(mapGrid));
  // Per-tile resource values are stored in a ref for synchronous reads
  // and shadowed in state to drive re-renders.
  const tileResourcesRef = useRef<Record<string, number>>({ ...tileResourceCapsRef.current });
  // The state counter exists solely to trigger re-renders when resources are consumed.
  const [, setTileResourcesVersion] = useState(0);

  const getBiomeTypeAt = useCallback(
    (x: number, y: number): BiomeType => mapGrid[y]?.[x] ?? 'plains',
    [mapGrid]
  );

  const getBiomeInfoAt = useCallback(
    (x: number, y: number) => BIOME_INFO[getBiomeTypeAt(x, y)],
    [getBiomeTypeAt]
  );

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

  /**
   * Shortest path length (in maze steps) between two in-bounds tiles.
   * Returns -1 if target is unreachable.
   */
  const getPathLength = useCallback((from: PlayerPosition, to: PlayerPosition): number => {
    if (
      from.x < 0 || from.x >= MAP_COLS || from.y < 0 || from.y >= MAP_ROWS ||
      to.x < 0 || to.x >= MAP_COLS || to.y < 0 || to.y >= MAP_ROWS
    ) {
      return -1;
    }

    if (from.x === to.x && from.y === to.y) return 0;

    const queue: Array<{ pos: PlayerPosition; steps: number }> = [{ pos: from, steps: 0 }];
    const seen = new Set<string>([tileKey(from.x, from.y)]);

    while (queue.length > 0) {
      const { pos, steps } = queue.shift()!;
      for (const nb of getMazeNeighbors(pos.x, pos.y)) {
        const k = tileKey(nb.x, nb.y);
        if (seen.has(k)) continue;
        if (nb.x === to.x && nb.y === to.y) return steps + 1;
        seen.add(k);
        queue.push({ pos: nb, steps: steps + 1 });
      }
    }

    return -1;
  }, []);

  /** True if tile (x, y) can be reached within `range` maze steps from current position. */
  const canMoveTo = useCallback(
    (x: number, y: number, range = 1): boolean => {
      const target = getPathLength(position, { x, y });
      return target !== -1 && target <= range;
    },
    [position, getPathLength]
  );

  /** Returns whether there is a direct maze passage between current tile and (x,y). */
  const isAdjacent = useCallback(
    (x: number, y: number): boolean =>
      hasPassage(position.x, position.y, x, y),
    [position]
  );

  const moveTo = useCallback(
    (x: number, y: number): boolean => {
      if (getPathLength(position, { x, y }) === -1) return false;
      if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return false;
      setPosition({ x, y });
      setVisitedTiles((prev) => {
        const next = new Set(prev);
        next.add(tileKey(x, y));
        return next;
      });
      return true;
    },
    [getPathLength, position]
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

  const depleteTileResource = useCallback((x: number, y: number) => {
    const key = tileKey(x, y);
    tileResourcesRef.current = { ...tileResourcesRef.current, [key]: 0 };
    setTileResourcesVersion((v) => v + 1);
  }, []);

  /** Returns the current resources remaining on tile (x, y). */
  const getTileResources = useCallback(
    (x: number, y: number): number => tileResourcesRef.current[tileKey(x, y)] ?? 0,
    []
  );

  /** Replenish all tiles to their initial cap (recharges every 7 days). */
  const replenishTileResources = useCallback(() => {
    tileResourcesRef.current = { ...tileResourceCapsRef.current };
    setTileResourcesVersion((v) => v + 1);
  }, []);

  const currentBiomeType = getBiomeTypeAt(position.x, position.y);
  const currentBiomeInfo = getBiomeInfoAt(position.x, position.y);

  /** Tiles the player hasn't visited but knows exist (all 8 neighbours of visited tiles). */
  const knownTiles = useMemo(() => {
    const known = new Set<string>();
    for (const key of visitedTiles) {
      const [xs, ys] = key.split(',');
      const x = Number(xs), y = Number(ys);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < MAP_COLS && ny >= 0 && ny < MAP_ROWS) {
            const nk = tileKey(nx, ny);
            if (!visitedTiles.has(nk)) known.add(nk);
          }
        }
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
    depleteTileResource,
    getTileResources,
    replenishTileResources,
    getReachableTiles,
    getPathLength,
    getBiomeTypeAt,
    getBiomeInfoAt,
    MAP_ROWS,
    MAP_COLS,
    mapGrid,
    caveTiles,
  };
}
