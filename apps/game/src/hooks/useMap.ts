// Hook managing the player's position on the world map.
// Exposes position, movement helpers, and current biome info.

import { useState, useCallback } from 'react';
import type { PlayerPosition } from '../types/map';
import { MAP_GRID, MAP_ROWS, MAP_COLS, INITIAL_PLAYER_POSITION, BIOME_INFO } from '../data/map';

export function useMap() {
  const [position, setPosition] = useState<PlayerPosition>(INITIAL_PLAYER_POSITION);

  const isValidTile = useCallback((x: number, y: number): boolean => {
    return x >= 0 && x < MAP_COLS && y >= 0 && y < MAP_ROWS;
  }, []);

  /**
   * Returns true if (x, y) is within `range` Chebyshev steps from the
   * current position (i.e. the largest of |dx|, |dy| ≤ range).
   */
  const canMoveTo = useCallback(
    (x: number, y: number, range = 1): boolean => {
      if (!isValidTile(x, y)) return false;
      const dx = Math.abs(x - position.x);
      const dy = Math.abs(y - position.y);
      return dx <= range && dy <= range && (dx + dy) > 0;
    },
    [position, isValidTile]
  );

  const moveTo = useCallback(
    (x: number, y: number): boolean => {
      if (!isValidTile(x, y)) return false;
      setPosition({ x, y });
      return true;
    },
    [isValidTile]
  );

  const currentBiomeType = MAP_GRID[position.y][position.x];
  const currentBiomeInfo = BIOME_INFO[currentBiomeType];

  return {
    position,
    currentBiomeType,
    currentBiomeInfo,
    canMoveTo,
    moveTo,
    MAP_ROWS,
    MAP_COLS,
  };
}
