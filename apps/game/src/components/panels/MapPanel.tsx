// Displays the 5x5 world map with fog-of-war, maze passages, resource counters, and animals.

import { MAP_GRID, BIOME_INFO, getMazeNeighbors } from '../../data/map';
import { tileKey } from '../../hooks/useMap';
import type { PlayerPosition, BiomeInfo } from '../../types/map';
import type { ActionCard } from '../../types/actionCard';
import type { WildAnimal } from '../../types/animal';
import { CardTitle } from '@glowing-potato/ui';

interface MapPanelProps {
  position: PlayerPosition;
  selectedCard: ActionCard | null;
  onTileClick: (x: number, y: number) => void;
  currentBiomeInfo: BiomeInfo;
  canMoveTo: (x: number, y: number, range?: number) => boolean;
  visitedTiles: Set<string>;
  knownTiles: Set<string>;
  getTileResources: (x: number, y: number) => number;
  getAnimalsAt: (x: number, y: number) => WildAnimal[];
  getReachableTiles: (from: PlayerPosition, maxSteps: number) => Set<string>;
  /** Tiles highlighted for attack (adjacent to player with animals) */
  attackTargetTiles?: Set<string>;
}

export function MapPanel({
  position,
  selectedCard,
  onTileClick,
  currentBiomeInfo,
  visitedTiles,
  knownTiles,
  getTileResources,
  getAnimalsAt,
  getReachableTiles,
  attackTargetTiles,
}: MapPanelProps) {
  const isMoveCard = selectedCard?.type === 'explore' || selectedCard?.type === 'sprint';
  const isAttackCard = selectedCard?.type === 'attack';
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

      {/* 5×5 grid */}
      <div
        className="grid gap-1 mb-3"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        {MAP_GRID.map((row, y) =>
          row.map((biome, x) => {
            const key = tileKey(x, y);
            const isPlayer = position.x === x && position.y === y;
            const isVisited = visitedTiles.has(key);
            const isKnown = knownTiles.has(key);
            const isReachable = reachable.has(key);
            const isAttackTarget = (attackTargetTiles ?? new Set()).has(key);
            const biomeInfo = BIOME_INFO[biome];
            const animals = getAnimalsAt(x, y);
            const resources = getTileResources(x, y);
            const depleted = resources === 0;

            // Determine visual passage indicators (right and down borders)
            const hasRightPassage = getMazeNeighbors(x, y).some((n) => n.x === x + 1 && n.y === y);
            const hasDownPassage = getMazeNeighbors(x, y).some((n) => n.x === x && n.y === y + 1);

            // Build tile class
            let tileClass =
              'aspect-square flex flex-col items-center justify-center rounded-lg text-base transition-all duration-150 relative select-none';

            if (!isVisited && !isKnown) {
              // Completely hidden
              tileClass += ' bg-gp-bg border border-gp-bg cursor-default';
            } else if (isAttackTarget) {
              tileClass += ' border-2 border-red-400 bg-red-900/40 hover:bg-red-800/50 cursor-pointer';
            } else if (isReachable) {
              tileClass += ' border border-gp-mint/70 bg-gp-mint/15 hover:bg-gp-mint/25 cursor-pointer animate-pulse';
            } else if (isPlayer) {
              tileClass += ' border-2 border-gp-mint bg-gp-accent/40 ring-2 ring-gp-mint shadow-lg z-10';
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
            const clickable = isReachable || isAttackTarget;

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
                    <span className="text-gp-accent/30 text-lg">?</span>
                  ) : (
                    <>
                      {/* Biome emoji */}
                      <span className={isKnown && !isVisited ? 'opacity-50' : ''}>{biomeInfo.emoji}</span>

                      {/* Player marker */}
                      {isPlayer && <span className="text-[9px] leading-none">🧑</span>}

                      {/* Animal markers */}
                      {isVisited && animals.length > 0 && (
                        <span className="text-[9px] leading-none">
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
                {x < 4 && hasRightPassage && !hidden && (
                  <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-1.5 h-2 bg-gp-accent/30 z-10 rounded-sm" />
                )}
                {/* Down passage indicator */}
                {y < 4 && hasDownPassage && !hidden && (
                  <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 h-1.5 w-2 bg-gp-accent/30 z-10 rounded-sm" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Current location info */}
      <div className="bg-gp-bg/30 rounded-lg border border-gp-accent/20 p-3">
        <div className="text-xs text-gp-mint/60 uppercase tracking-wide mb-1">Current Location</div>
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gp-mint">
            {currentBiomeInfo.emoji} {currentBiomeInfo.name}
          </div>
          <div className="text-xs">
            {getTileResources(position.x, position.y) === 0 ? (
              <span className="text-red-400/80">🪨 Depleted</span>
            ) : (
              <span className="text-gp-mint/60">
                Resources: {getTileResources(position.x, position.y)}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-gp-mint/85 mt-1 leading-snug">
          {currentBiomeInfo.description}
        </div>
        {currentBiomeInfo.categoryBonus.length > 0 && (
          <div className="text-xs text-gp-mint/70 mt-1.5">
            ✨ Bonus: <span className="font-semibold text-gp-mint">{currentBiomeInfo.categoryBonus.join(', ')}</span>
          </div>
        )}
        {currentBiomeInfo.rarityBonus && currentBiomeInfo.rarityBonus.length > 0 && (
          <div className="text-xs text-amber-300/80 mt-0.5">
            ⭐ Rare boost: {currentBiomeInfo.rarityBonus.join(', ')}
          </div>
        )}
      </div>

      {isMoveCard && (
        <p className="mt-2 text-xs text-gp-mint/70 text-center animate-pulse">
          ✨ Click a highlighted tile to move there
        </p>
      )}
      {isAttackCard && (
        <p className="mt-2 text-xs text-red-400/80 text-center animate-pulse">
          ⚔️ Click an adjacent tile with an animal to attack
        </p>
      )}
    </div>
  );
}
