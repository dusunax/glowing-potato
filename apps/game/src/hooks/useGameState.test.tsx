import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { useGameState } from './useGameState';

type GameState = ReturnType<typeof useGameState>;

const getStateRef = { current: null as GameState | null };

type InventoryState = Record<string, number>;

let inventoryState: InventoryState;
let removeItemMock: ReturnType<typeof vi.fn>;
let addItemMock: ReturnType<typeof vi.fn>;
let getQuantityMock: ReturnType<typeof vi.fn>;
let attackAnimalMock: ReturnType<typeof vi.fn>;
let getAnimalsAtMock: ReturnType<typeof vi.fn>;
let getAdjacentHostileMock: ReturnType<typeof vi.fn>;
let getAdjacentAnimalsMock: ReturnType<typeof vi.fn>;

const hostileAnimal = (attack: number) => [
  {
    id: 'wild-wolf',
    name: 'Wolf',
    emoji: '🐺',
    attack,
  },
];

const mountGameState = () => {
  function Probe() {
    getStateRef.current = useGameState();
    return null;
  }
  const result = render(<Probe />);
  return () => {
    result.unmount();
    getStateRef.current = null;
  };
};

const resetInventory = (seed: InventoryState) => {
  inventoryState = { ...seed };

  removeItemMock = vi.fn((itemId: string, quantity = 1) => {
    const current = inventoryState[itemId] ?? 0;
    if (current < quantity) {
      return false;
    }
    const next = current - quantity;
    if (next <= 0) {
      delete inventoryState[itemId];
    } else {
      inventoryState[itemId] = next;
    }
    return true;
  });

  addItemMock = vi.fn((itemId: string, quantity = 1) => {
    inventoryState[itemId] = (inventoryState[itemId] ?? 0) + quantity;
  });

  getQuantityMock = vi.fn((itemId: string) => inventoryState[itemId] ?? 0);
};

const getCurrentState = () => {
  if (!getStateRef.current) {
    throw new Error('Game state is not initialized');
  }
  return getStateRef.current;
};

const getTypeDistribution = (events: GameState['events']) => {
  const counts = { success: 0, info: 0, warning: 0 };
  for (const event of events) {
    counts[event.type]++;
  }
  return counts;
};

const getTypeDeltas = (before: GameState['events'], after: GameState['events']) => ({
  success: getTypeDistribution(after).success - getTypeDistribution(before).success,
  info: getTypeDistribution(after).info - getTypeDistribution(before).info,
  warning: getTypeDistribution(after).warning - getTypeDistribution(before).warning,
});

vi.mock('./useConditions', () => ({
  useConditions: vi.fn(() => ({
    conditions: {
      season: 'Spring',
      weather: 'Sunny',
      timePeriod: 'Morning',
      day: 1,
    },
    advance: vi.fn(() => ({
      messages: [] as string[],
      isNewDay: false,
      resourceRefillCount: 0,
      caveSpawnCount: 0,
      skeletonSpawnCount: 0,
    })),
    shiftWeather: vi.fn(() => 'Weather changed.'),
  })),
}));

vi.mock('./useInventory', () => ({
  useInventory: vi.fn(() => ({
    inventory: Object.entries(inventoryState).map(([itemId, quantity]) => ({
      itemId,
      quantity,
    })),
    addItem: addItemMock,
    removeItem: removeItemMock,
    getQuantity: getQuantityMock,
  })),
}));

vi.mock('./useDiscovery', () => ({
  useDiscovery: vi.fn(() => ({
    discovered: new Set<string>(),
    markDiscovered: vi.fn(),
    isDiscovered: vi.fn(() => false),
  })),
}));

vi.mock('./useItemSpawn', () => ({
  useItemSpawn: vi.fn(() => ({
    collect: vi.fn(() => ''),
  })),
}));

vi.mock('./useCrafting', () => ({
  useCrafting: vi.fn(() => ({
    canCraft: vi.fn(() => false),
    craft: vi.fn(() => 'missing recipe'),
    recipes: [],
  })),
}));

vi.mock('./useMap', () => {
  const defaultBiome = {
    type: 'meadow',
    emoji: '🌿',
    name: 'Meadow',
    description: 'Calm meadow',
    categoryBonus: [] as string[],
  };
  return {
    useMap: vi.fn(() => ({
      position: { x: 0, y: 0 },
      currentBiomeInfo: defaultBiome,
      getBiomeInfoAt: vi.fn(() => defaultBiome),
      mapGrid: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 'meadow' as const)),
      caveTiles: [],
      visitedTiles: new Set(['0,0']),
      knownTiles: new Set<string>(),
      canMoveTo: vi.fn(() => true),
      isAdjacent: vi.fn(() => true),
      moveTo: vi.fn(() => true),
      consumeTileResource: vi.fn(() => 0),
      depleteTileResource: vi.fn(),
      getTileResources: vi.fn(() => 1),
      replenishTileResources: vi.fn(),
      getReachableTiles: vi.fn(() => new Set<string>(['1,0'])),
      getPathLength: vi.fn(() => 1),
      MAP_ROWS: 8,
      MAP_COLS: 8,
    })),
  };
});

vi.mock('./useActionCards', () => ({
  useActionCards: vi.fn(() => ({
    hand: [],
    selectedCard: null,
    selectCard: vi.fn(),
    playCard: vi.fn(),
    deckSize: 0,
  })),
}));

vi.mock('./useAnimals', () => ({
  useAnimals: vi.fn(() => ({
    animals: [],
    moveAnimals: vi.fn(),
    spawnCaveWave: vi.fn(),
    spawnCaveWaveWithTemplates: vi.fn(() => []),
    attackAnimal: attackAnimalMock,
    getAnimalsAt: getAnimalsAtMock,
    getAdjacentHostile: getAdjacentHostileMock,
    getAdjacentAnimals: getAdjacentAnimalsMock,
  })),
}));

describe('useGameState item consumption', () => {
  beforeEach(() => {
    resetInventory({ apple: 0 });
    attackAnimalMock = vi.fn(() => ({ hit: false }));
    getAnimalsAtMock = vi.fn(() => []);
    getAdjacentHostileMock = vi.fn(() => []);
    getAdjacentAnimalsMock = vi.fn(() => []);
    vi.clearAllMocks();
  });

  it('consumes a consumable item and updates hp plus xp', () => {
    resetInventory({ healing_potion: 1 });
    attackAnimalMock = vi.fn(() => ({
      hit: true,
      message: 'You hit the wolf.',
      defeated: false,
      animalName: 'Wolf',
      animalEmoji: '🐺',
      animalRarity: 2,
      experience: 0,
    }));
    getAdjacentHostileMock = vi.fn(() => hostileAnimal(2));
    const cleanup = mountGameState();

    act(() => {
      getCurrentState().handleStrike('wolf');
    });
    expect(getCurrentState().playerHp).toBe(8);

    const eventsBeforeUse = getCurrentState().events;
    const xpBeforeUse = getCurrentState().playerXp;
    const maxHpBeforeUse = getCurrentState().maxPlayerHp;

    act(() => {
      const consumed = getCurrentState().handleUseItem('healing_potion');
      expect(consumed).toBe(true);
    });

    const nextState = getCurrentState();
    expect(nextState.playerHp).toBe(maxHpBeforeUse);
    expect(nextState.playerXp).toBe(xpBeforeUse + 6);
    const deltas = getTypeDeltas(eventsBeforeUse, nextState.events);
    expect(deltas.success).toBeGreaterThan(0);
    expect(deltas.info).toBe(0);
    expect(deltas.warning).toBe(0);
    expect(removeItemMock).toHaveBeenCalledWith('healing_potion', 1);
    cleanup();
  });

  it('does not consume food when health is full', () => {
    resetInventory({ apple: 1 });
    const cleanup = mountGameState();

    const eventsBeforeUse = getCurrentState().events;
    let consumed = true;
    act(() => {
      consumed = getCurrentState().handleUseItem('apple');
    });

    expect(consumed).toBe(false);
    expect(removeItemMock).not.toHaveBeenCalled();
    expect(getCurrentState().playerHp).toBe(10);
    const deltas = getTypeDeltas(eventsBeforeUse, getCurrentState().events);
    expect(deltas).toEqual({ success: 0, info: 0, warning: 1 });
    cleanup();
  });

  it('does not consume unknown quantity and keeps inventory intact', () => {
    resetInventory({ apple: 0 });

    attackAnimalMock = vi.fn(() => ({
      hit: true,
      message: 'You hit the wolf.',
      defeated: false,
      animalName: 'Wolf',
      animalEmoji: '🐺',
      animalRarity: 2,
      experience: 0,
    }));
    getAdjacentHostileMock = vi.fn(() => hostileAnimal(2));
    const cleanup = mountGameState();

    act(() => {
      getCurrentState().handleStrike('wolf');
    });

    const stateBeforeUse = { ...getCurrentState() };
    const eventsBeforeUse = getCurrentState().events;
    act(() => {
      const consumed = getCurrentState().handleUseItem('apple');
      expect(consumed).toBe(false);
    });

    const stateAfterUse = getCurrentState();
    expect(stateAfterUse.playerHp).toBe(stateBeforeUse.playerHp);
    expect(stateAfterUse.playerXp).toBe(stateBeforeUse.playerXp);
    const deltas = getTypeDeltas(eventsBeforeUse, getCurrentState().events);
    expect(deltas).toEqual({ success: 0, info: 0, warning: 0 });
    expect(removeItemMock).toHaveBeenCalledWith('apple', 1);
    expect(addItemMock).not.toHaveBeenCalled();
    cleanup();
  });

  it('rejects non-consumable items', () => {
    resetInventory({ bone: 1 });
    const cleanup = mountGameState();

    const eventsBeforeUse = getCurrentState().events;
    act(() => {
      const consumed = getCurrentState().handleUseItem('bone');
      expect(consumed).toBe(false);
    });

    expect(removeItemMock).not.toHaveBeenCalled();
    expect(addItemMock).not.toHaveBeenCalled();
    const deltas = getTypeDeltas(eventsBeforeUse, getCurrentState().events);
    expect(deltas).toEqual({ success: 0, info: 0, warning: 1 });
    cleanup();
  });

  it('caps healed HP at maximum when consumption would exceed max HP', () => {
    resetInventory({ healing_potion: 1 });
    attackAnimalMock = vi.fn(() => ({
      hit: true,
      message: 'You hit the wolf.',
      defeated: false,
      animalName: 'Wolf',
      animalEmoji: '🐺',
      animalRarity: 2,
      experience: 0,
    }));
    getAdjacentHostileMock = vi.fn(() => hostileAnimal(1));
    const cleanup = mountGameState();

    act(() => {
      getCurrentState().handleStrike('wolf');
    });

    expect(getCurrentState().playerHp).toBe(9);

    const eventsBeforeUse = getCurrentState().events;
    act(() => {
      const consumed = getCurrentState().handleUseItem('healing_potion');
      expect(consumed).toBe(true);
    });

    expect(getCurrentState().playerHp).toBe(10);
    const deltas = getTypeDeltas(eventsBeforeUse, getCurrentState().events);
    expect(deltas.success).toBeGreaterThan(0);
    expect(deltas.info).toBe(0);
    expect(deltas.warning).toBe(0);
    expect(removeItemMock).toHaveBeenCalledWith('healing_potion', 1);
    cleanup();
  });
});
