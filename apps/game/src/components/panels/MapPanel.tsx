// Displays the world map with fog-of-war, maze passages, resource counters, and animals.

import {
  BIOME_ICON_SPRITE_COLUMNS,
  BIOME_ICON_SPRITES,
  BIOME_ICON_SPRITE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  BIOME_INFO,
  getMazeNeighbors,
} from '../../data/map';
import { tileKey } from '../../hooks/useMap';
import type { PlayerPosition, BiomeInfo, BiomeType } from '../../types/map';
import type { ActionCard } from '../../types/actionCard';
import type { WildAnimal } from '../../types/animal';
import type { CSSProperties } from 'react';
import { CardTitle } from '@glowing-potato/ui';
import PlayerMarker, { type PlayerActionState } from './PlayerMarker';
import { AnimalSprite } from '../ui/AnimalSprite';

interface MapPanelProps {
  position: PlayerPosition;
  selectedCard: ActionCard | null;
  showPlayerMoveHint?: boolean;
  showArrowMoveHint?: boolean;
  showFirstMoveHint?: boolean;
  onTileClick: (x: number, y: number) => void;
  mapGrid: BiomeType[][];
  currentBiomeInfo: BiomeInfo;
  isTreasureRewardClaimed?: boolean;
  canMoveTo: (x: number, y: number, range?: number) => boolean;
  visitedTiles: Set<string>;
  knownTiles: Set<string>;
  getTileResources: (x: number, y: number) => number;
  getAnimalsAt: (x: number, y: number) => WildAnimal[];
  getReachableTiles: (from: PlayerPosition, maxSteps: number) => Set<string>;
  nearbyAnimalTiles: Set<string>;
  equippedWeaponEmoji?: string;
  equippedWeaponName?: string;
  playerActionState?: PlayerActionState;
  keyboardMoveCursor?: { x: number; y: number } | null;
}

export function MapPanel({
  position,
  selectedCard,
  showPlayerMoveHint = false,
  showArrowMoveHint = false,
  showFirstMoveHint = false,
  onTileClick,
  mapGrid,
  currentBiomeInfo,
  isTreasureRewardClaimed = false,
  canMoveTo,
  visitedTiles,
  knownTiles,
  getTileResources,
  getAnimalsAt,
  getReachableTiles,
  nearbyAnimalTiles,
  equippedWeaponEmoji,
  equippedWeaponName,
  playerActionState = 'idle',
  keyboardMoveCursor = null,
}: MapPanelProps) {
  const isMoveCard = selectedCard?.type === 'explore' || selectedCard?.type === 'sprint';
  const moveRange = selectedCard?.moveRange ?? 1;

  const reachable = isMoveCard
    ? keyboardMoveCursor
      ? getReachableTiles(keyboardMoveCursor, 1)
      : getReachableTiles(position, moveRange)
    : new Set<string>();

  const worldMapTitleIcon: [number, number] = [0, 7];
  const worldMapTitleIconSheet: keyof typeof BIOME_ICON_SPRITES = 'default';
  const worldMapTitleIconPath = BIOME_ICON_SPRITES[worldMapTitleIconSheet];
  const worldMapTitleIconStyle: CSSProperties = {
    backgroundImage: `url('${worldMapTitleIconPath}')`,
    backgroundSize: `${BIOME_ICON_SPRITE_COLUMNS * BIOME_ICON_SPRITE_SIZE}px auto`,
    backgroundPosition: `${-(worldMapTitleIcon[1] * BIOME_ICON_SPRITE_SIZE)}px ${-(worldMapTitleIcon[0] * BIOME_ICON_SPRITE_SIZE)}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  };
  return (
    <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4">
      <div className="flex items-end justify-between mb-3">
        <div className="flex items-center">
          <span
            className="inline-block shrink-0 rounded-sm bg-contain w-8 h-8 scale-75"
            style={worldMapTitleIconStyle}
            aria-hidden="true"
            title="World map icon"
          />
          <CardTitle>World Map</CardTitle>
        </div>
        <div className="text-sm font-semibold text-gp-mint/50">
          <span>@{currentBiomeInfo.name}</span>
        </div>
      </div>

      {/* World grid */}
      <div className="relative">
        <div
          className="grid gap-0.5 mb-3"
          style={{ gridTemplateColumns: `repeat(${mapGrid[0]?.length ?? MAP_COLS}, 1fr)` }}
        >
        {mapGrid.map((row, y) =>
          row.map((biome, x) => {
            const key = tileKey(x, y);
            const isPlayer = position.x === x && position.y === y;
            const isVisited = visitedTiles.has(key);
            const isKnown = knownTiles.has(key);
            const animals = getAnimalsAt(x, y);
            const moveTarget = isMoveCard && (
              keyboardMoveCursor
                ? reachable.has(key)
                : (reachable.has(key) || canMoveTo(x, y, moveRange))
            );
            const isReachable = moveTarget && animals.length === 0;
            const biomeInfo = BIOME_INFO[biome];
            const isTreasureTile = biome === 'treasure';
            const tileEmoji = isTreasureTile && isTreasureRewardClaimed ? '📭' : biomeInfo.emoji;
            const tileName = isTreasureTile && isTreasureRewardClaimed ? 'Treasure Opened' : biomeInfo.name;
            const resources = getTileResources(x, y);
            const depleted = resources === 0;
            const isNearbyAnimal = nearbyAnimalTiles.has(key);
            const isKeyboardCursor = keyboardMoveCursor !== null && keyboardMoveCursor.x === x && keyboardMoveCursor.y === y;
            const shouldShowTexture = isVisited || isKnown || isPlayer;
            const texturePath = shouldShowTexture && biomeInfo.texture ? biomeInfo.texture : undefined;
            const isOceanBiome = biome === 'lake';
            const playerMode: PlayerActionState = isMoveCard ? 'move' : playerActionState;
            const isAttackableTile = isNearbyAnimal;
            const iconCoord = biomeInfo.iconSpriteMatrix ?? [0, 0];
            const iconRow = iconCoord[0] ?? 0;
            const iconColumn = iconCoord[1] ?? 0;
            const iconSpritePath = BIOME_ICON_SPRITES[biomeInfo.iconSpriteSheet ?? 'default'];
            const biomeIconStyle: CSSProperties = {
              backgroundImage: `url('${iconSpritePath}')`,
              backgroundSize: `${BIOME_ICON_SPRITE_COLUMNS * BIOME_ICON_SPRITE_SIZE}px auto`,
              backgroundPosition: `${-(iconColumn * BIOME_ICON_SPRITE_SIZE)}px ${-(iconRow * BIOME_ICON_SPRITE_SIZE)}px`,
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            };

            const tileStyle: CSSProperties = {};
            if (texturePath) {
              const dimFactor = !isVisited && isKnown ? 0.65 : isVisited && depleted ? 0.5 : 0.22;
              const dimLayer = `linear-gradient(rgba(8, 16, 12, ${dimFactor}), rgba(8, 16, 12, ${dimFactor}))`;
              const oceanLayer = isOceanBiome
                ? 'linear-gradient(to bottom, rgba(8, 16, 12, 0.0) 80%, rgba(17, 84, 154, 0.55) 100%)'
                : '';
              tileStyle.backgroundImage = `${dimLayer}${oceanLayer ? `, ${oceanLayer}` : ''}, url('${texturePath}')`;
              tileStyle.backgroundSize = 'cover';
              tileStyle.backgroundPosition = 'center';
              tileStyle.backgroundRepeat = 'no-repeat';
            }

            // Determine visual passage indicators (right and down borders)
            const hasRightPassage = getMazeNeighbors(x, y).some((n) => n.x === x + 1 && n.y === y);
            const hasDownPassage = getMazeNeighbors(x, y).some((n) => n.x === x && n.y === y + 1);
            const isAdjacentToPlayer = Math.abs(position.x - x) + Math.abs(position.y - y) === 1;
            const showAdjacentMoveHint = showFirstMoveHint && isAdjacentToPlayer && canMoveTo(x, y, 1);
            const initialMoveArrow =
              x === position.x && y === position.y - 1
                ? '↑'
                : x === position.x && y === position.y + 1
                  ? '↓'
                  : y === position.y && x === position.x - 1
                    ? '←'
                    : y === position.y && x === position.x + 1
                      ? '→'
                      : '';
            const firstMoveArrowClass =
              initialMoveArrow === '↑'
                ? 'gp-first-move-arrow-bounce-up'
                : initialMoveArrow === '↓'
                  ? 'gp-first-move-arrow-bounce-down'
                  : initialMoveArrow === '←'
                    ? 'gp-first-move-arrow-bounce-left'
                    : initialMoveArrow === '→'
                      ? 'gp-first-move-arrow-bounce-right'
                      : '';

            // Build tile class
            let tileClass =
              'aspect-square flex w-full h-full flex-col items-center justify-center text-base transition-all duration-150 relative select-none';

            if (isKeyboardCursor) {
              // Keyboard sprint cursor — yellow highlight
              tileClass +=
                ' border-2 border-yellow-300 bg-yellow-300/25 shadow-[0_0_0_2px_rgba(253,224,71,0.5)] cursor-pointer z-10';
            } else if (isReachable) {
              // Reachable via card — strong movement hint
              tileClass +=
                ' border border-cyan-200/90 bg-cyan-300/20 hover:bg-cyan-200/35 cursor-pointer shadow-[0_0_0_1px_rgba(34,211,238,0.45)]';
            } else if (isNearbyAnimal) {
              tileClass += ' border-2 border-red-400/90 bg-red-500/35 hover:bg-red-500/55 cursor-pointer animate-pulse shadow-[0_0_0_2px_rgba(248,113,113,0.45)]';
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

            if (texturePath) {
              tileClass += ' bg-center bg-cover bg-no-repeat';
            }

            const hidden = !isVisited && !isKnown;
            const clickable = isMoveCard
              ? (isReachable || isNearbyAnimal || isPlayer)
              : (isNearbyAnimal || isPlayer);
            const primaryAnimal = animals[0];

            return (
              <div key={key} className="relative" data-testid={`map-tile-${x}-${y}`}>
                <button
                  data-testid={`map-panel-tile-btn-${x}-${y}`}
                  onClick={() => clickable ? onTileClick(x, y) : undefined}
                  disabled={!clickable}
                  className={tileClass}
                  style={texturePath ? tileStyle : undefined}
                  title={hidden ? '???' : tileName}
                  aria-label={hidden ? 'Unknown tile' : `${tileName}${isPlayer ? ' (you are here)' : ''}`}
                >
                  {hidden ? (
                    <>
                      <span className="text-gp-accent/30 text-lg">?</span>
                      {animals.length > 0 && (
                        <span className="text-[9px] leading-none opacity-50">⚠️</span>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Biome icon from spritesheet */}
                      <span
                        data-testid={`map-tile-biome-icon-${x}-${y}`}
                        className={`absolute bottom-0 left-0 scale-75 h-8 w-8 rounded-sm bg-contain ${isKnown && !isVisited && !isAttackableTile ? 'opacity-50' : ''}`}
                        style={biomeIconStyle}
                        title={tileEmoji}
                        aria-hidden="true"
                      />

                      {/* Player marker */}
                      {isPlayer && (
                        <PlayerMarker
                          mode={playerMode}
                          equippedWeaponEmoji={equippedWeaponEmoji}
                          equippedWeaponName={equippedWeaponName}
                        />
                      )}

                      {/* Animal markers — visible on any revealed tile */}
                  {primaryAnimal && primaryAnimal.sprite && (
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] leading-none${isKnown && !isVisited && !isAttackableTile ? ' opacity-50' : ''}`}
                              title={primaryAnimal.name}
                            >
                              <AnimalSprite
                                name={primaryAnimal.name}
                                emoji={primaryAnimal.emoji}
                                sprite={primaryAnimal.sprite}
                                className="h-6 w-6 relative z-20 scale-95"
                              />
                          {animals.length > 1 ? `+${animals.length - 1}` : ''}
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
                  {showAdjacentMoveHint && initialMoveArrow && (
                    <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                      <span
                        className={`${firstMoveArrowClass} inline-block text-xl sm:text-2xl text-emerald-200/95 scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]`}
                      >
                        {initialMoveArrow}
                      </span>
                    </span>
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
      </div>

      <div className="h-4" />
    </div>
  );
}
