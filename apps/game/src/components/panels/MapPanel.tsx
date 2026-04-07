// Displays the world map with fog-of-war, maze passages, resource counters, and animals.

import { MAP_COLS, MAP_ROWS, BIOME_INFO, getMazeNeighbors } from '../../data/map';
import { tileKey } from '../../hooks/useMap';
import type { PlayerPosition, BiomeInfo, BiomeType } from '../../types/map';
import type { ActionCard } from '../../types/actionCard';
import type { WildAnimal } from '../../types/animal';
import { CardTitle } from '@glowing-potato/ui';

interface MapPanelProps {
  position: PlayerPosition;
  selectedCard: ActionCard | null;
  showPlayerMoveHint?: boolean;
  onTileClick: (x: number, y: number) => void;
  mapGrid: BiomeType[][];
  currentBiomeInfo: BiomeInfo;
  canMoveTo: (x: number, y: number, range?: number) => boolean;
  visitedTiles: Set<string>;
  knownTiles: Set<string>;
  getTileResources: (x: number, y: number) => number;
  getAnimalsAt: (x: number, y: number) => WildAnimal[];
  getReachableTiles: (from: PlayerPosition, maxSteps: number) => Set<string>;
  nearbyAnimalTiles: Set<string>;
}

export function MapPanel({
  position,
  selectedCard,
  showPlayerMoveHint = false,
  onTileClick,
  mapGrid,
  currentBiomeInfo,
  visitedTiles,
  knownTiles,
  getTileResources,
  getAnimalsAt,
  getReachableTiles,
  nearbyAnimalTiles,
}: MapPanelProps) {
  const isMoveCard = selectedCard?.type === 'explore' || selectedCard?.type === 'sprint';
  const moveRange = selectedCard?.moveRange ?? 1;

  const reachable = isMoveCard
    ? getReachableTiles(position, moveRange)
    : new Set<string>();

  return (
    <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <CardTitle>🗺️ World Map</CardTitle>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gp-mint">
          <span>{currentBiomeInfo.emoji}</span>
          <span>{currentBiomeInfo.name}</span>
        </div>
      </div>

      {/* World grid */}
      <div
        className="grid gap-1 mb-3"
        style={{ gridTemplateColumns: `repeat(${mapGrid[0]?.length ?? MAP_COLS}, 1fr)` }}
      >
        {mapGrid.map((row, y) =>
          row.map((biome, x) => {
            const key = tileKey(x, y);
            const isPlayer = position.x === x && position.y === y;
            const isVisited = visitedTiles.has(key);
            const isKnown = knownTiles.has(key);
            const animals = getAnimalsAt(x, y);
            const isReachable = reachable.has(key) && animals.length === 0;
            const biomeInfo = BIOME_INFO[biome];
            const resources = getTileResources(x, y);
            const depleted = resources === 0;
            const isNearbyAnimal = nearbyAnimalTiles.has(key);

            // Determine visual passage indicators (right and down borders)
            const hasRightPassage = getMazeNeighbors(x, y).some((n) => n.x === x + 1 && n.y === y);
            const hasDownPassage = getMazeNeighbors(x, y).some((n) => n.x === x && n.y === y + 1);

            // Build tile class
            let tileClass =
              'aspect-square flex w-full h-full flex-col items-center justify-center rounded-lg text-base transition-all duration-150 relative select-none';

            if (isReachable) {
              // Reachable via card — highlight even if hidden (sprint can dash into fog)
              tileClass += ' border border-gp-mint/70 bg-gp-mint/15 hover:bg-gp-mint/25 cursor-pointer animate-pulse';
            } else if (isNearbyAnimal) {
              tileClass += ' border-2 border-red-500/80 bg-red-900/30 hover:bg-red-800/50 cursor-pointer animate-pulse';
            } else if (!isVisited && !isKnown) {
              // Completely hidden
              tileClass += animals.length > 0
                ? ' bg-gp-bg border border-red-900/40 cursor-default'
                : ' bg-gp-bg border border-gp-bg cursor-default';
            } else if (isPlayer) {
              tileClass += ` border-2 border-gp-mint bg-gp-accent/40 ring-2 ring-gp-mint shadow-lg z-10 ${
                showPlayerMoveHint ? 'animate-pulse scale-105 ring-gp-mint/90' : ''
              }`;
            } else if (!isVisited && isKnown) {
              // Known but unvisited — dim
              tileClass += ' border border-gp-accent/20 bg-gp-bg/60 opacity-60 cursor-default';
            } else {
              // Visited
              tileClass += depleted
                ? ' border border-gp-accent/20 bg-gp-bg/50 opacity-70 cursor-default'
                : ' border border-gp-accent/20 bg-gp-bg/30 cursor-default';
            }

            const hidden = !isVisited && !isKnown;
            const clickable = isMoveCard
              ? (isReachable || isNearbyAnimal || isPlayer)
              : (isNearbyAnimal || isPlayer);

            return (
              <div key={key} className="relative">
                <button
                  onClick={() => clickable ? onTileClick(x, y) : undefined}
                  disabled={!clickable}
                  className={tileClass}
                  title={hidden ? '???' : biomeInfo.name}
                  aria-label={hidden ? 'Unknown tile' : `${biomeInfo.name}${isPlayer ? ' (you are here)' : ''}`}
                >
                  {hidden ? (
                    <>
                      <span className="text-gp-accent/30 text-lg">?</span>
                      {animals.length > 0 && (
                        <span className="text-[9px] leading-none opacity-50">🐾</span>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Biome emoji */}
                      <span className={isKnown && !isVisited ? 'opacity-50' : ''}>{biomeInfo.emoji}</span>

                      {/* Player marker */}
                      {isPlayer && <span className="text-[9px] leading-none">🧑</span>}

                      {/* Animal markers — visible on any revealed tile */}
                      {animals.length > 0 && (
                        <span className={`text-[9px] leading-none${isKnown && !isVisited ? ' opacity-50' : ''}`}>
                          {animals[0]!.emoji}{animals.length > 1 ? `+${animals.length - 1}` : ''}
                        </span>
                      )}

                      {/* Resource counter (small badge bottom-right) */}
                      {isVisited && (
                        <span
                          className={[
                            'absolute bottom-0.5 right-0.5 text-[9px] font-bold leading-none rounded px-0.5',
                            depleted
                              ? 'text-red-400/80'
                              : resources === 1
                              ? 'text-amber-400/80'
                              : 'text-gp-mint/60',
                          ].join(' ')}
                        >
                          {depleted ? '✗' : resources}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* Right passage indicator */}
                {x < MAP_COLS - 1 && hasRightPassage && !hidden && (
                  <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-1.5 h-2 bg-gp-accent/30 z-10 rounded-sm pointer-events-none" />
                )}
                {/* Down passage indicator */}
                {y < MAP_ROWS - 1 && hasDownPassage && !hidden && (
                  <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 h-1.5 w-2 bg-gp-accent/30 z-10 rounded-sm pointer-events-none" />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className='h-4'>
        {isMoveCard && (
          <p className="mt-2 text-xs text-gp-mint/70 text-center animate-pulse">
            ✨ Click a highlighted tile to move there
          </p>
        )}
        {isMoveCard && nearbyAnimalTiles.size > 0 && (
          <p className="mt-2 text-xs text-gp-mint/70 text-center animate-pulse">
            🐾 Adjacent animals are visible in the list
          </p>
        )}
        {!isMoveCard && nearbyAnimalTiles.size > 0 && (
          <p className="mt-2 text-xs text-red-300/90 text-center animate-pulse">
            ⚔️ Click a red-highlighted tile to attack the animal
          </p>
        )}
      </div>
    </div>
  );
}
