import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { BIOME_INFO, MAP_GRID } from '../../data/map';
import type { ActionCard } from '../../types/actionCard';
import type { WorldConditions } from '../../types/conditions';
import { MapPanel } from './MapPanel';
import type { WildAnimal } from '../../types/animal';

describe('MapPanel', () => {
  const allTiles = new Set<string>();
  MAP_GRID.forEach((row, y) => {
    row.forEach((_biome, x) => {
      allTiles.add(`${x},${y}`);
    });
  });

  const baseActionCard: ActionCard = {
    id: 'explore',
    type: 'explore',
    name: 'Explore',
    description: 'Move to a nearby tile.',
    emoji: '🚶',
    rarity: 1,
    moveRange: 1,
  };

  const currentBiome = BIOME_INFO.meadow;

  const baseConditions: WorldConditions = {
    day: 1,
    season: 'Spring',
    weather: 'Sunny',
    timePeriod: 'Morning',
  };

  const renderPanel = (props: {
    selectedCard: ActionCard | null;
    reachable?: Set<string>;
    nearbyAnimals?: Set<string>;
    playerActionState?: 'idle' | 'move' | 'skill' | 'discover' | 'attack';
    animalsByTile?: Array<WildAnimal | null>;
    playerX?: number;
    playerY?: number;
    onTileClick?: ReturnType<typeof vi.fn>;
  }) => {
    const {
      selectedCard,
      reachable = new Set(),
      nearbyAnimals = new Set(),
      playerActionState = 'idle',
      animalsByTile = [],
      playerX = 0,
      playerY = 0,
      onTileClick = vi.fn(),
    } = props;

    const getAnimalsAt = vi.fn((x: number, y: number) => {
      const item = animalsByTile.find((entry) => entry !== null && entry.position.x === x && entry.position.y === y);
      return item ? [item] : [];
    });

    render(
      <MapPanel
        position={{ x: playerX, y: playerY }}
        selectedCard={selectedCard}
        showPlayerMoveHint={false}
        onTileClick={onTileClick}
        mapGrid={MAP_GRID}
        currentBiomeInfo={currentBiome}
        isTreasureRewardClaimed={false}
        canMoveTo={vi.fn()}
        visitedTiles={allTiles}
        knownTiles={allTiles}
        getTileResources={() => 1}
        getAnimalsAt={getAnimalsAt}
        getReachableTiles={() => reachable}
        nearbyAnimalTiles={nearbyAnimals}
        equippedWeaponEmoji="🗡️"
        equippedWeaponName="Test Blade"
        playerActionState={playerActionState}
      />,
    );

    return { getAnimalsAt, onTileClick };
  };

  it('fires click when the player uses a move card and target tile is reachable', () => {
    const onTileClick = vi.fn();
    const reachable = new Set<string>(['1,0']);

    const { getAnimalsAt } = renderPanel({
      selectedCard: baseActionCard,
      reachable,
      onTileClick,
    });

    const targetTile = screen.getByTestId('map-panel-tile-btn-1-0');
    fireEvent.click(targetTile);

    expect(onTileClick).toHaveBeenCalledTimes(1);
    expect(onTileClick).toHaveBeenCalledWith(1, 0);
    expect(getAnimalsAt).toHaveBeenCalledWith(1, 0);
  });

  it('keeps non-move flow clickable only for nearby animal tiles', () => {
    const onTileClick = vi.fn();
    const animalsByTile = [
      {
        id: 'a1',
        name: 'Wooly Bunny',
        emoji: '🐇',
        behavior: 'neutral',
        maxHp: 2,
        hp: 2,
        attack: 1,
        experienceReward: 0,
        rarity: 1,
        alive: true,
        position: { x: 1, y: 0 },
      },
    ];

    renderPanel({
      selectedCard: null,
      playerActionState: 'attack',
      nearbyAnimals: new Set(['1,0']),
      animalsByTile,
      onTileClick,
    });

    const targetTile = screen.getByTestId('map-panel-tile-btn-1-0');
    fireEvent.click(targetTile);

    const playerTile = within(screen.getByTestId('map-tile-0-0')).getByTestId('player-marker-badge');
    expect(playerTile).toHaveTextContent('ATTACK');
    expect(onTileClick).toHaveBeenCalledTimes(1);
  });

  it('ignores click when tile is not reachable and no nearby animal exists', () => {
    const onTileClick = vi.fn();

    renderPanel({
      selectedCard: null,
      nearbyAnimals: new Set(),
      reachable: new Set(),
      onTileClick,
    });

    const targetTile = screen.getByTestId('map-panel-tile-btn-1-0');
    fireEvent.click(targetTile);

    expect(onTileClick).not.toHaveBeenCalled();
  });
});

