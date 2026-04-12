import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { WorldConditions } from '../../types/conditions';
import type { BiomeType } from '../../types/map';
import { SPAWN_LAYER_UNLOCK_COST_BY_LEVEL, getSpawnableItemsByLayer } from '../../utils/spawning';
import { ITEMS } from '../../data/items';
import { SpawnPanel } from './SpawnPanel';

const baseConditions: WorldConditions = {
  season: 'Spring',
  weather: 'Sunny',
  timePeriod: 'Morning',
  day: 1,
};

  const meadow: BiomeType = 'meadow';

  const SpawnPanelStateHost = ({
    initialPoints,
    initialRevealLevel,
    initialUnlockLevel,
  }: {
    initialPoints: number;
    initialRevealLevel: number;
    initialUnlockLevel?: number;
  }) => {
    const [scoutPoints, setScoutPoints] = useState(initialPoints);
    const [scoutRevealLevel, setScoutRevealLevel] = useState(initialRevealLevel);
    const [scoutUnlockLevel, setScoutUnlockLevel] = useState(initialUnlockLevel ?? initialRevealLevel);
    const [selectedSpawnLayer, setSelectedSpawnLayer] = useState(initialRevealLevel);
    const [onUnlockSpawnLayerCallCount, setOnUnlockSpawnLayerCallCount] = useState(0);
    const [lastUnlockedLevel, setLastUnlockedLevel] = useState<number | null>(null);

    return (
      <>
        <SpawnPanel
          conditions={baseConditions}
          biomeType={meadow}
          scoutPoints={scoutPoints}
          scoutRevealLevel={scoutRevealLevel}
          scoutUnlockLevel={scoutUnlockLevel}
          unlockedSpawnLayerItemCounts={{
            1: 0,
            2: 0,
          }}
          selectedSpawnLayer={selectedSpawnLayer}
          onUnlockSpawnLayer={(level) => {
            setOnUnlockSpawnLayerCallCount((count) => count + 1);
            setLastUnlockedLevel(level);
            const currentCost = SPAWN_LAYER_UNLOCK_COST_BY_LEVEL[scoutUnlockLevel] ?? 0;
            const targetCost = SPAWN_LAYER_UNLOCK_COST_BY_LEVEL[level] ?? currentCost;
            const needed = targetCost - currentCost;
            if (scoutPoints >= needed && level === scoutUnlockLevel + 1) {
              setScoutPoints((prev) => Math.max(0, prev - needed));
              setScoutUnlockLevel(level);
              setScoutRevealLevel(level);
              setSelectedSpawnLayer(level);
            }
          }}
          onUnlockSpawnLayerItem={vi.fn()}
          onSelectSpawnLayer={setSelectedSpawnLayer}
        />
        <span data-testid="unlock-call-count" className="hidden">
          {onUnlockSpawnLayerCallCount}
        </span>
        <span data-testid="last-unlocked-level" className="hidden">
          {lastUnlockedLevel ?? ''}
        </span>
        <span data-testid="active-points" className="hidden">
          {scoutPoints}
        </span>
        <span data-testid="active-reveal-level" className="hidden">
          {scoutRevealLevel}
        </span>
        <span data-testid="active-unlock-level" className="hidden">
          {scoutUnlockLevel}
        </span>
      </>
    );
  };

describe('SpawnPanel', () => {
  const setup = (options: {
    scoutPoints: number;
    scoutRevealLevel: number;
    scoutUnlockLevel?: number;
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
        scoutUnlockLevel={options.scoutUnlockLevel ?? options.scoutRevealLevel}
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
      scoutUnlockLevel: 1,
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
      scoutUnlockLevel: 1,
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

  it('enforces sequential layer unlocking (must unlock Lv.2 before Lv.3)', () => {
    const { onUnlockSpawnLayer } = setup({
      scoutPoints: 7,
      scoutRevealLevel: 1,
      scoutUnlockLevel: 1,
      selectedSpawnLayer: 1,
      unlockedSpawnLayerItemCounts: {
        1: 0,
      },
    });

    const layer2Card = screen.getByTestId('spawn-layer-2-card');
    const layer2Unlock = screen.getByTestId('spawn-layer-2-unlock-layer-btn');
    const layer3Unlock = screen.getByTestId('spawn-layer-3-unlock-layer-btn');

    expect(layer2Card.getAttribute('tabindex')).toBe('-1');
    expect(layer2Unlock).not.toBeDisabled();
    fireEvent.click(layer2Unlock);
    expect(onUnlockSpawnLayer).toHaveBeenCalledTimes(1);
    expect(onUnlockSpawnLayer).toHaveBeenCalledWith(2);

    expect(layer3Unlock).toBeDisabled();
    fireEvent.click(layer3Unlock);
    expect(onUnlockSpawnLayer).toHaveBeenCalledTimes(1);
  });

  it('does not auto-unlock Lv.2 when only scout points increase', () => {
    setup({
      scoutPoints: 3,
      scoutRevealLevel: 3,
      scoutUnlockLevel: 1,
      selectedSpawnLayer: 1,
    });

    const layer2Card = screen.getByTestId('spawn-layer-2-card');
    const layer2Unlock = screen.getByTestId('spawn-layer-2-unlock-layer-btn');

    expect(layer2Card.getAttribute('tabindex')).toBe('-1');
    expect(layer2Unlock).not.toBeDisabled();
  });

  it('allows Lv.3 unlock immediately after Lv.2 is unlocked when scout points remain enough', () => {
    render(<SpawnPanelStateHost initialPoints={7} initialRevealLevel={1} />);

    const layer2Unlock = screen.getByTestId('spawn-layer-2-unlock-layer-btn');
    const layer3UnlockInitial = screen.getByTestId('spawn-layer-3-unlock-layer-btn');

    expect(layer2Unlock).not.toBeDisabled();
    expect(layer3UnlockInitial).toBeDisabled();

    fireEvent.click(layer2Unlock);

    const unlockCallCount = Number(screen.getByTestId('unlock-call-count').textContent || '0');
    const unlockLevelAfterLv2 = Number(screen.getByTestId('active-unlock-level').textContent || '1');
    const pointsAfterLv2 = Number(screen.getByTestId('active-points').textContent || '0');
    const layer3Unlock = screen.getByTestId('spawn-layer-3-unlock-layer-btn');

    expect(unlockCallCount).toBe(1);
    expect(unlockLevelAfterLv2).toBe(2);
    expect(pointsAfterLv2).toBe(4);
    expect(layer3Unlock).not.toBeDisabled();
    expect(Number(screen.getByTestId('last-unlocked-level').textContent || '0')).toBe(2);

    fireEvent.click(layer3Unlock);
    expect(screen.getByTestId('last-unlocked-level').textContent).toBe('3');
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
      scoutUnlockLevel: scoutRevealLevel,
      selectedSpawnLayer: 2,
      unlockedSpawnLayerItemCounts: {
        1: 0,
        2: 0,
      },
    });

    const unlockItemButton = screen.getByTestId('spawn-layer-2-unlock-item-btn');

    expect(unlockItemButton).not.toBeDisabled();
    expect(unlockItemButton).toHaveTextContent('Scout for Item (1pt)');
    fireEvent.click(unlockItemButton);
    expect(onUnlockSpawnLayerItem).toHaveBeenCalledTimes(1);
    expect(onUnlockSpawnLayerItem).toHaveBeenCalledWith(2);
    expect(onUnlockSpawnLayer).not.toHaveBeenCalled();
    expect(onSelectSpawnLayer).not.toHaveBeenCalled();
  });

  it('allows unlocking Canopy (Lv.3) when player has exactly 4 points and Lv.2 is unlocked', () => {
    const { onUnlockSpawnLayer } = setup({
      scoutPoints: 4,
      scoutRevealLevel: 2,
      scoutUnlockLevel: 2,
      selectedSpawnLayer: 2,
      unlockedSpawnLayerItemCounts: {
        1: 0,
        2: 0,
      },
    });

    const unlockButton = screen.getByTestId('spawn-layer-3-unlock-layer-btn');
    const layerCard = screen.getByTestId('spawn-layer-3-card');
    expect(layerCard).toBeDefined();
    expect(unlockButton).not.toBeDisabled();
    fireEvent.click(unlockButton);
    expect(onUnlockSpawnLayer).toHaveBeenCalledTimes(1);
    expect(onUnlockSpawnLayer).toHaveBeenCalledWith(3);
  });
});
