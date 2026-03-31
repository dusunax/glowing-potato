// Displays the 5x5 world map. Shows the player's current position and, when a
// move card is selected, highlights reachable tiles so the player can click to move.

import { MAP_GRID, BIOME_INFO } from '../../data/map';
import type { PlayerPosition, BiomeInfo } from '../../types/map';
import type { ActionCard } from '../../types/actionCard';
import { CardTitle } from '@glowing-potato/ui';

interface MapPanelProps {
  position: PlayerPosition;
  selectedCard: ActionCard | null;
  onTileClick: (x: number, y: number) => void;
  currentBiomeInfo: BiomeInfo;
  canMoveTo: (x: number, y: number, range?: number) => boolean;
}

export function MapPanel({
  position,
  selectedCard,
  onTileClick,
  currentBiomeInfo,
  canMoveTo,
}: MapPanelProps) {
  const isMoveCard =
    selectedCard?.type === 'explore' || selectedCard?.type === 'sprint';
  const moveRange = selectedCard?.moveRange ?? 1;

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
        className="grid gap-1.5 mb-3"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        {MAP_GRID.map((row, y) =>
          row.map((biome, x) => {
            const isPlayer = position.x === x && position.y === y;
            const reachable = isMoveCard && canMoveTo(x, y, moveRange);
            const biomeInfo = BIOME_INFO[biome];

            let tileClass =
              'aspect-square flex flex-col items-center justify-center rounded-lg border text-xl transition-all duration-150 relative';

            if (isPlayer) {
              tileClass +=
                ' border-gp-mint bg-gp-accent/40 ring-2 ring-gp-mint shadow-lg z-10';
            } else if (reachable) {
              tileClass +=
                ' border-gp-mint/70 bg-gp-mint/15 hover:bg-gp-mint/25 cursor-pointer animate-pulse';
            } else {
              tileClass +=
                ' border-gp-accent/20 bg-gp-bg/30 opacity-80';
            }

            return (
              <button
                key={`${x}-${y}`}
                onClick={() => reachable ? onTileClick(x, y) : undefined}
                disabled={!reachable && !isPlayer}
                className={tileClass}
                title={biomeInfo.name}
                aria-label={`${biomeInfo.name}${isPlayer ? ' (you are here)' : ''}`}
              >
                <span>{biomeInfo.emoji}</span>
                {isPlayer && (
                  <span className="text-[10px] leading-none mt-0.5">🧑</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Current location info */}
      <div className="bg-gp-bg/30 rounded-lg border border-gp-accent/20 p-3">
        <div className="text-xs text-gp-mint/60 uppercase tracking-wide mb-1">
          Current Location
        </div>
        <div className="font-semibold text-gp-mint">
          {currentBiomeInfo.emoji} {currentBiomeInfo.name}
        </div>
        {/* text-gp-mint/85 on gp-bg/30 background: sufficient contrast ✓ */}
        <div className="text-xs text-gp-mint/85 mt-1 leading-snug">
          {currentBiomeInfo.description}
        </div>
        {currentBiomeInfo.categoryBonus.length > 0 && (
          <div className="text-xs text-gp-mint/70 mt-1.5">
            ✨ Bonus:{' '}
            <span className="font-semibold text-gp-mint">
              {currentBiomeInfo.categoryBonus.join(', ')}
            </span>
          </div>
        )}
        {currentBiomeInfo.rarityBonus && currentBiomeInfo.rarityBonus.length > 0 && (
          <div className="text-xs text-amber-300/80 mt-0.5">
            ⭐ Rare boost:{' '}
            {currentBiomeInfo.rarityBonus.join(', ')}
          </div>
        )}
      </div>

      {isMoveCard && (
        <p className="mt-2 text-xs text-gp-mint/70 text-center animate-pulse">
          ✨ Click a highlighted tile to move there
        </p>
      )}
    </div>
  );
}
