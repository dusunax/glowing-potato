import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BIOME_INFO } from '../data/map';
import type { WorldConditions } from '../types/conditions';
import * as spawning from '../utils/spawning';
import { useItemSpawn } from './useItemSpawn';

const conditions: WorldConditions = {
  season: 'Spring',
  weather: 'Cloudy',
  timePeriod: 'Morning',
  day: 22,
};

describe('useItemSpawn', () => {
  it('collects a valid item for Meadow / Spring / Cloudy / Morning conditions', () => {
    const addItem = vi.fn();
    const markDiscovered = vi.fn();
    const consumeTileResource = vi.fn(() => 2);

    const { result } = renderHook(() =>
      useItemSpawn({
        conditions,
        biomeInfo: BIOME_INFO.meadow,
        scoutRevealLevel: 2,
        selectedSpawnLayer: 1,
        unlockedSpawnLayerItemCounts: { 1: 0 },
        addItem,
        markDiscovered,
        consumeTileResource,
      }),
    );

    let message = '';
    act(() => {
      message = result.current.collect();
    });

    expect(message).toMatch(/^You found a /);
    expect(message).not.toContain('Nothing to collect right now');
    expect(addItem).toHaveBeenCalledTimes(1);
    expect(markDiscovered).toHaveBeenCalledTimes(1);
    expect(consumeTileResource).toHaveBeenCalledTimes(1);
  });

  it('returns empty-spot feedback when spawn candidates are truly exhausted', () => {
    const addItem = vi.fn();
    const markDiscovered = vi.fn();
    const consumeTileResource = vi.fn(() => 2);
    const layerSpy = vi.spyOn(spawning, 'getSpawnableItemsByLayer');

    layerSpy.mockReturnValue([]);

    try {
      const { result } = renderHook(() =>
        useItemSpawn({
          conditions,
          biomeInfo: BIOME_INFO.meadow,
          scoutRevealLevel: 2,
          selectedSpawnLayer: 2,
          unlockedSpawnLayerItemCounts: { 2: 99 },
          addItem,
          markDiscovered,
          consumeTileResource,
        }),
      );

      let message = '';
      act(() => {
        message = result.current.collect();
      });

      expect(message).toBe('Nothing to collect right now. Try a different time or weather.');
      expect(addItem).not.toHaveBeenCalled();
      expect(markDiscovered).not.toHaveBeenCalled();
      expect(consumeTileResource).toHaveBeenCalledTimes(1);
      expect(layerSpy).toHaveBeenCalled();
    } finally {
      layerSpy.mockRestore();
    }
  });

  it('prioritizes layer unlock checks before stale unlock over-allocation after clamp', () => {
    const addItem = vi.fn();
    const markDiscovered = vi.fn();
    const consumeTileResource = vi.fn(() => 2);

    const { result } = renderHook(() =>
      useItemSpawn({
        conditions,
        biomeInfo: BIOME_INFO.meadow,
        scoutRevealLevel: 2,
        selectedSpawnLayer: 1,
        unlockedSpawnLayerItemCounts: { 1: 99 },
        addItem,
        markDiscovered,
        consumeTileResource,
      }),
    );

    let message = '';
    act(() => {
      message = result.current.collect();
    });

    expect(message).toMatch(/^You found a /);
    expect(addItem).toHaveBeenCalledTimes(1);
    expect(markDiscovered).toHaveBeenCalledTimes(1);
  });
});
