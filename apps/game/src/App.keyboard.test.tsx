import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import type { ActionCard } from './types/actionCard';

type AnimalTarget = {
  id: string;
  name: string;
  emoji: string;
  position: { x: number; y: number };
  hp: number;
  maxHp: number;
  attack: number;
  sprite?: string;
};

const createMoveCard = (overrides: Partial<ActionCard> = {}): ActionCard => ({
  id: 'explore-basic',
  type: 'explore',
  name: 'Explore',
  description: 'Move to a neighboring tile',
  emoji: '🗺️',
  rarity: 1,
  moveRange: 1,
  ...overrides,
});

const createSprintCard = (overrides: Partial<ActionCard> = {}): ActionCard => ({
  id: 'sprint-basic',
  type: 'sprint',
  name: 'Sprint',
  description: 'Move up to two tiles away',
  emoji: '🏃',
  rarity: 2,
  moveRange: 2,
  ...overrides,
});

const createForageCard = (overrides: Partial<ActionCard> = {}): ActionCard => ({
  id: 'forage-basic',
  type: 'forage',
  name: 'Forage',
  description: 'Collect nearby resources',
  emoji: '🌿',
  rarity: 1,
  ...overrides,
});

const defaultAnimal: AnimalTarget = {
  id: 'wolf',
  name: 'Wolf',
  emoji: '🐺',
  position: { x: 1, y: 1 },
  hp: 4,
  maxHp: 4,
  attack: 2,
};

let mockedGameState: Record<string, unknown>;

vi.mock('./components/GameLobby', () => {
  return {
    GameLobby: ({ onSelectGame }: { onSelectGame: (gameId: string) => void }) => {
      React.useEffect(() => {
        onSelectGame('collection');
      }, [onSelectGame]);

      return null;
    },
  };
});

vi.mock('./hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    nickname: '',
    loading: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    updateNickname: vi.fn(),
  })),
}));

vi.mock('./hooks/useScoreRecord', () => ({
  useScoreRecord: vi.fn(() => ({
    saveRecord: vi.fn(),
  })),
}));

vi.mock('./hooks/useLeaderboard', () => ({
  useLeaderboard: vi.fn(() => ({
    records: [],
    loading: false,
    refresh: vi.fn(),
    invalidate: vi.fn(),
  })),
}));

vi.mock('./hooks/useGameState', () => ({
  useGameState: vi.fn(() => mockedGameState),
}));

const getBaseGameState = (overrides: Record<string, unknown> = {}) => {
  const selectCard = vi.fn();
  const handlePlayCard = vi.fn();
  const handleAttackAnimal = vi.fn();
  const getQuantity = vi.fn(() => 1);
  const moveCard = createMoveCard();
  const initialAdjacentAnimals = (overrides as { adjacentAnimals?: AnimalTarget[] }).adjacentAnimals ?? [];
  const base = {
    conditions: {
      season: 'Spring',
      weather: 'Sunny',
      timePeriod: 'Morning',
      day: 1,
    },
    playerHp: 10,
    maxPlayerHp: 10,
    playerLevel: 1,
    playerXp: 0,
    xpToNextLevel: 30,
    isPlayerDead: false,
    inventory: [],
    discovered: new Set<string>(),
    events: [],
    recipes: [],
    getQuantity,
    canCraft: vi.fn(() => true),
    handleCraft: vi.fn(),
    totalXpGained: 0,
    defeatedAnimals: [],
    position: { x: 2, y: 2 },
    mapGrid: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 'meadow')),
    currentBiomeInfo: {
      type: 'meadow',
      emoji: '🌿',
      name: 'Meadow',
      description: 'Open grassland to start',
      categoryBonus: [],
    },
    visitedTiles: new Set(['2,2']),
    knownTiles: new Set<string>(),
    canMoveTo: vi.fn(() => true),
    getTileResources: vi.fn(() => 1),
    getReachableTiles: vi.fn(() => new Set(['3,2'])),
    getAnimalsAt: vi.fn(() => []),
    getAdjacentAnimals: vi.fn(() => initialAdjacentAnimals),
    animals: [],
    deathCause: undefined,
    scoutRevealLevel: 0,
    scoutUnlockLevel: 0,
    scoutPoints: 0,
    spawnLayerUnlockedItemCounts: {},
    unlockSpawnLayer: vi.fn(),
    unlockNextSpawnItemAtLayer: vi.fn(),
    selectedSpawnLayer: 0,
    setSelectedSpawnLayer: vi.fn(),
    hand: [moveCard, createForageCard()],
    selectedCard: null,
    selectCard,
    handlePlayCard,
    handleStrike: vi.fn(),
    handleUseItem: vi.fn(),
    grantTreasureReward: vi.fn(),
    depleteTileResource: vi.fn(),
    pushEvent: vi.fn(),
    showDamageFlash: false,
    deckSize: 4,
    handleAttackAnimal,
  };

  return {
    ...base,
    ...overrides,
  };
};

async function renderCollectionGame(overrides: Record<string, unknown> = {}) {
  mockedGameState = getBaseGameState(overrides);

  render(<App />);

  const startButton = await screen.findByRole('button', { name: 'Start' });
  fireEvent.click(startButton);
  await screen.findByRole('button', { name: '🧭 Game' });
}

beforeEach(() => {
  mockedGameState = getBaseGameState();
  vi.clearAllMocks();
});

describe('CollectionGame keyboard controls', () => {
  it('selects first hand card with Q', async () => {
    const selectCard = vi.fn();
    const moveCard = createMoveCard();

    await renderCollectionGame({
      hand: [moveCard, createForageCard()],
      selectedCard: null,
      selectCard,
    });

    fireEvent.keyDown(window, { key: 'q', code: 'KeyQ' });

    expect(selectCard).toHaveBeenCalledWith(moveCard);
  });

  it('moves one tile right with arrow key when explore card is selected', async () => {
    const handlePlayCard = vi.fn();
    const moveCard = createMoveCard();

    await renderCollectionGame({
      hand: [moveCard],
      selectedCard: moveCard,
      handlePlayCard,
    });

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(handlePlayCard).toHaveBeenCalledWith(moveCard, { x: 3, y: 2 });
  });

  it('attacks adjacent animal on arrow input when target is occupied', async () => {
    const handleStrike = vi.fn();
    const handlePlayCard = vi.fn();
    const rightAnimal = { ...defaultAnimal, id: 'wolf-right', position: { x: 3, y: 2 } };
    const getAdjacentAnimals = vi.fn(() => [rightAnimal]);

    await renderCollectionGame({
      hand: [createSprintCard()],
      selectedCard: createMoveCard(),
      handlePlayCard,
      handleStrike,
      getAdjacentAnimals,
    });

    fireEvent.click(screen.getByRole('button', { name: '🧭 Game' }));
    fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });

    expect(getAdjacentAnimals).toHaveBeenCalled();
    expect(getAdjacentAnimals).toHaveBeenCalledWith({ x: 2, y: 2 });
    expect(getAdjacentAnimals.mock.results[0]?.value).toEqual([rightAnimal]);
    expect(handleStrike).toHaveBeenCalledWith('wolf-right');
    expect(handlePlayCard).not.toHaveBeenCalled();
  });

  it('confirms sprint target with Enter', async () => {
    const handlePlayCard = vi.fn();
    const sprintCard = createSprintCard();
    const getAdjacentAnimals = vi.fn(() => []);

    await renderCollectionGame({
      hand: [sprintCard],
      selectedCard: sprintCard,
      handlePlayCard,
      getAdjacentAnimals,
    });

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });

    expect(handlePlayCard).toHaveBeenCalledWith(sprintCard, { x: 3, y: 2 });
  });

  it('attacks first adjacent animal with F key', async () => {
    const handleStrike = vi.fn();
    const rightAnimal = { ...defaultAnimal, id: 'wolf-right', position: { x: 3, y: 2 } };
    const getAdjacentAnimals = vi.fn(() => [rightAnimal]);

    await renderCollectionGame({
      hand: [createMoveCard()],
      selectedCard: null,
      getAdjacentAnimals,
      handleStrike,
    });

    fireEvent.click(screen.getByRole('button', { name: '🧭 Game' }));
    fireEvent.keyDown(window, { key: 'f', code: 'KeyF' });

    expect(getAdjacentAnimals).toHaveBeenCalled();
    expect(getAdjacentAnimals).toHaveBeenCalledWith({ x: 2, y: 2 });
    expect(getAdjacentAnimals.mock.results[0]?.value).toEqual([rightAnimal]);
    expect(handleStrike).toHaveBeenCalledWith('wolf-right');
  });

  it('cycles tabs with Tab key', async () => {
    await renderCollectionGame();

    const gameTab = screen.getByRole('button', { name: '🧭 Game' });
    const inventoryTab = screen.getByRole('button', { name: '🎒 Inventory' });

    expect(gameTab).not.toHaveClass('text-gp-mint');
    expect(inventoryTab).not.toHaveClass('text-gp-mint');

    fireEvent.keyDown(window, { key: 'Tab' });

    expect(gameTab).not.toHaveClass('text-gp-mint');
    expect(inventoryTab).toHaveClass('text-gp-mint');
  });

  it('cancels selected card and cursor on Escape', async () => {
    const selectCard = vi.fn();
    const moveCard = createMoveCard();

    await renderCollectionGame({
      hand: [moveCard],
      selectedCard: moveCard,
      selectCard,
    });

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(selectCard).toHaveBeenCalledWith(null);
  });

  it('uses belt quick key when assigned to belt slot', async () => {
    const handleUseItem = vi.fn();
    const pushEvent = vi.fn();
    const getQuantity = vi.fn((itemId: string) => (itemId === 'healing_potion' ? 1 : 0));

    await renderCollectionGame({
      inventory: [{ itemId: 'healing_potion', quantity: 1 }],
      getQuantity,
      handleUseItem,
      pushEvent,
    });

    fireEvent.click(screen.getByTestId('inventory-belt-slot-1'));
    fireEvent.click(screen.getByTestId('inventory-assign-0-healing_potion'));
    fireEvent.keyDown(window, { key: 'x', code: 'KeyX' });

    expect(handleUseItem).toHaveBeenCalledWith('healing_potion');
    expect(pushEvent).not.toHaveBeenCalled();
  });
});
