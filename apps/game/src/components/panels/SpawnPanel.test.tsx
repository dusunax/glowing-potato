import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { WorldConditions } from '../../types/conditions';
import type { BiomeType } from '../../types/map';
import { getSpawnableItemsByLayer } from '../../utils/spawning';
import { ITEMS } from '../../data/items';
import { SpawnPanel } from './SpawnPanel';

const baseConditions: WorldConditions = {
  season: 'Spring',
  weather: 'Sunny',
  timePeriod: 'Morning',
  day: 1,
};

const meadow: BiomeType = 'meadow';

describe('SpawnPanel', () => {
  const setup = (options: {
    scoutPoints: number;
    scoutRevealLevel: number;
    selectedSpawnLayer: number;
    unlockedSpawnLayerItemCounts?: Record<number, number>;
  }) => {
    const callbacks = {
      onSelectSpawnLayer: vi.fn(),
      onUnlockSpawnLayer: vi.fn(),
      onUnlockSpawnLayerItem: vi.fn(),
    };
    render(
      <SpawnPanel
        conditions={baseConditions}
        biomeType={meadow}
        scoutPoints={options.scoutPoints}
        scoutRevealLevel={options.scoutRevealLevel}
        unlockedSpawnLayerItemCounts={options.unlockedSpawnLayerItemCounts ?? {}}
        selectedSpawnLayer={options.selectedSpawnLayer}
        onUnlockSpawnLayer={callbacks.onUnlockSpawnLayer}
        onUnlockSpawnLayerItem={callbacks.onUnlockSpawnLayerItem}
        onSelectSpawnLayer={callbacks.onSelectSpawnLayer}
      />,
    );

    return {
      ...callbacks,
    };
  };

  it('invokes select callback for unlocked spawn tree layers', () => {
    const { onSelectSpawnLayer, onUnlockSpawnLayer, onUnlockSpawnLayerItem } = setup({
      scoutPoints: 3,
      scoutRevealLevel: 3,
      selectedSpawnLayer: 1,
    });

    const unlockedLayerCard = screen.getByTestId('spawn-layer-2-card');
    const lockState = unlockedLayerCard.getAttribute('tabindex');

    expect(lockState).toBe('0');
    fireEvent.click(unlockedLayerCard);

    expect(onSelectSpawnLayer).toHaveBeenCalledTimes(1);
    expect(onSelectSpawnLayer).toHaveBeenCalledWith(2);
    expect(onUnlockSpawnLayer).not.toHaveBeenCalled();
    expect(onUnlockSpawnLayerItem).not.toHaveBeenCalled();
  });

  it('keeps the next layer locked when scout points are not enough', () => {
    const { onUnlockSpawnLayer, onSelectSpawnLayer } = setup({
      scoutPoints: 2,
      scoutRevealLevel: 1,
      selectedSpawnLayer: 1,
    });

    const layerCard = screen.getByTestId('spawn-layer-2-card');
    expect(layerCard.getAttribute('tabindex')).toBe('-1');

    const unlockButton = screen.getByTestId('spawn-layer-2-unlock-layer-btn');
    expect(unlockButton).toBeDisabled();

    fireEvent.click(unlockButton);
    expect(onUnlockSpawnLayer).not.toHaveBeenCalled();
    expect(onSelectSpawnLayer).not.toHaveBeenCalled();
  });

  it('unlocks the next layer when scout points are enough', () => {
    const { onUnlockSpawnLayer, onUnlockSpawnLayerItem, onSelectSpawnLayer } = setup({
      scoutPoints: 3,
      scoutRevealLevel: 1,
      selectedSpawnLayer: 1,
    });

    const unlockButton = screen.getByTestId('spawn-layer-2-unlock-layer-btn');

    expect(unlockButton).not.toBeDisabled();
    fireEvent.click(unlockButton);
    expect(onUnlockSpawnLayer).toHaveBeenCalledTimes(1);
    expect(onUnlockSpawnLayer).toHaveBeenCalledWith(2);
    expect(onUnlockSpawnLayerItem).not.toHaveBeenCalled();
    expect(onSelectSpawnLayer).not.toHaveBeenCalled();
  });

  it('renders a full spawn tree from layer 1 to 5', () => {
    setup({
      scoutPoints: 16,
      scoutRevealLevel: 5,
      selectedSpawnLayer: 3,
    });

    expect(screen.getAllByTestId(/^spawn-layer-[1-5]$/)).toHaveLength(5);
  });

  it('uses layer-item unlock when layer is open but not all items are unlocked', () => {
    const scoutRevealLevel = 3;
    const layerItems = getSpawnableItemsByLayer(ITEMS, baseConditions, scoutRevealLevel, 2, meadow);

    if (layerItems.length === 0) {
      expect(screen.queryByTestId('spawn-layer-2-unlock-item-btn')).toBeNull();
      return;
    }

    const { onUnlockSpawnLayerItem, onUnlockSpawnLayer, onSelectSpawnLayer } = setup({
      scoutPoints: 1,
      scoutRevealLevel,
      selectedSpawnLayer: 2,
      unlockedSpawnLayerItemCounts: {
        1: 0,
        2: 0,
      },
    });

    const unlockItemButton = screen.getByTestId('spawn-layer-2-unlock-item-btn');

    expect(unlockItemButton).not.toBeDisabled();
    fireEvent.click(unlockItemButton);
    expect(onUnlockSpawnLayerItem).toHaveBeenCalledTimes(1);
    expect(onUnlockSpawnLayerItem).toHaveBeenCalledWith(2);
    expect(onUnlockSpawnLayer).not.toHaveBeenCalled();
    expect(onSelectSpawnLayer).not.toHaveBeenCalled();
  });
});
