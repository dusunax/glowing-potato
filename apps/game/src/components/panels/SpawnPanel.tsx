// Shows which items can currently spawn given world conditions.

import { ITEMS } from '../../data/items';
import type { WorldConditions } from '../../types/conditions';
import { Badge, CardTitle } from '@glowing-potato/ui';
import {
  getSpawnableItems,
  getBaseSpawnableItems,
  getSpawnableItemsByLayerForUnlock,
  MAX_SPAWN_REVEAL_LEVEL,
  SPAWN_LAYER_UNLOCK_COST_BY_LEVEL,
} from '../../utils/spawning';
import type { Item, ItemRarity } from '../../types/items';
import type { BiomeType } from '../../types/map';

interface SpawnPanelProps {
  conditions: WorldConditions;
  biomeType: BiomeType;
  scoutPoints: number;
  scoutRevealLevel: number;
  scoutUnlockLevel: number;
  unlockedSpawnLayerItemCounts: Record<number, number>;
  selectedSpawnLayer: number;
  onUnlockSpawnLayerItem: (layer: number) => void;
  onUnlockSpawnLayer: (layer: number) => void;
  onSelectSpawnLayer: (layer: number) => void;
}

const TREE_LEVEL_LABELS: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Foundation-Root', subtitle: 'Basic resources and shallow foraging' },
  2: { title: 'Brush', subtitle: 'Wild shrubs and roots' },
  3: { title: 'Canopy', subtitle: 'Mixed flora and mineral pockets' },
  4: { title: 'Deep', subtitle: 'Rare finds begin to emerge' },
  5: { title: 'Apex', subtitle: 'Treasure-level resources' },
};

interface SpawnTreeNode {
  level: number;
  title: string;
  subtitle: string;
  unlocked: boolean;
  items: Item[];
}

const RARITY_BADGE_MAP: Record<ItemRarity, 'default' | 'success' | 'warning' | 'muted' | 'danger'> = {
  1: 'muted',
  2: 'success',
  3: 'default',
  4: 'warning',
  5: 'danger',
};
const RARITY_LABELS: Record<ItemRarity, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '⭐⭐⭐⭐⭐',
};

export function SpawnPanel({
  conditions,
  biomeType,
  scoutPoints,
  scoutRevealLevel,
  scoutUnlockLevel,
  unlockedSpawnLayerItemCounts,
  onUnlockSpawnLayerItem,
  onUnlockSpawnLayer,
  selectedSpawnLayer,
  onSelectSpawnLayer,
}: SpawnPanelProps) {
  const revealLevel = Math.min(Math.max(1, scoutRevealLevel), MAX_SPAWN_REVEAL_LEVEL);
  const baseSpawnable = getBaseSpawnableItems(ITEMS);
  const spawnable = [...baseSpawnable, ...getSpawnableItems(ITEMS, conditions, revealLevel, biomeType)];
  const unlockedLayer = Math.min(Math.max(1, scoutUnlockLevel), MAX_SPAWN_REVEAL_LEVEL);
  const activeScoutLevel = Math.max(0, Number.isFinite(scoutPoints) ? scoutPoints : 0);
  const treeNodes: SpawnTreeNode[] = [
    ...Array.from({ length: MAX_SPAWN_REVEAL_LEVEL }, (_, index) => {
      const level = index + 1;
      const isUnlocked = level <= unlockedLayer;
      const unlockedNow = getSpawnableItemsByLayerForUnlock(ITEMS, level, level, biomeType);
      const unlockedBefore = level > 1 ? getSpawnableItemsByLayerForUnlock(ITEMS, level - 1, level - 1, biomeType) : [];
      const beforeIds = new Set(unlockedBefore.map((item) => item.id));
      const levelItems = isUnlocked ? unlockedNow.filter((item) => !beforeIds.has(item.id)) : [];
      const label = TREE_LEVEL_LABELS[level] ?? { title: `Layer ${level}`, subtitle: 'Expanding zone' };
      return {
        level,
        title: label.title,
        subtitle: label.subtitle,
        unlocked: isUnlocked,
        items: levelItems,
      };
    }),
  ];
  const EMPTY_SLOT_CLASS =
    'min-h-[62px] border border-dashed border-gp-mint/55 rounded-lg';
  const EMPTY_SLOT_STYLE = {
    background: 'linear-gradient(180deg, rgba(var(--gp-bg), 0.82) 0%, rgba(var(--gp-bg), 0.65) 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(var(--gp-accent), 0.25)',
  };

  return (
    <div className="flex flex-col min-h-0 h-full" data-testid="spawn-panel">
      <CardTitle className="mb-0.5">🌍 Spawnable Now</CardTitle>
      <p className="text-xs text-gp-mint/70 mb-1">
        {spawnable.length} item(s) available
      </p>
      <p className="text-[11px] text-gp-mint/50 mb-3">
        Scout points: {activeScoutLevel} • Unlock level: {unlockedLayer}/{MAX_SPAWN_REVEAL_LEVEL}
      </p>
      <div
        className="space-y-3 overflow-y-auto min-h-0 max-h-[calc(100vh-16rem)]"
      >
        {treeNodes.map((node, index) => {
          const isLocked = !node.unlocked;
          const isSelected = selectedSpawnLayer === node.level;
          const requiredPoints = SPAWN_LAYER_UNLOCK_COST_BY_LEVEL[node.level] ?? 0;
          const previousLevel = Math.max(0, node.level - 1);
          const previousCost = SPAWN_LAYER_UNLOCK_COST_BY_LEVEL[previousLevel] ?? 0;
          const unlockCost = requiredPoints - previousCost;
          const canUnlockNode = node.level === unlockedLayer + 1;
          const isAffordable = unlockCost <= activeScoutLevel;
          const unlockedCount = Math.max(
            0,
            unlockedSpawnLayerItemCounts[node.level] ?? (node.level === 1 ? node.items.length : 0),
          );
          const displayCount = Math.min(node.items.length, unlockedCount);
          const nodeText = isLocked ? `Need ${requiredPoints} points` : `${displayCount}/${node.items.length} unlocked`;
          const unlockDisabled = isLocked && (!canUnlockNode || !isAffordable);
          const canUnlockItem = !isLocked && displayCount < node.items.length;
          const canUnlockItemNow = canUnlockItem && activeScoutLevel >= 1;
          const cardClass = isSelected
            ? 'border-gp-mint/80 bg-gp-mint/10'
            : 'border-gp-accent/30 bg-gp-bg/30';
          return (
            <div key={`spawn-tree-${node.level}`} className="relative" data-testid={`spawn-layer-${node.level}`}>
              <div className="flex items-start gap-3">
                <div className="relative mt-1">
                  <div
                    className={`h-2.5 w-2.5 rounded-full border ${
                      isLocked
                        ? 'border-gp-accent/40 bg-gp-bg/50'
                        : 'border-gp-mint/80 bg-gp-mint/80'
                    }`}
                  />
                  {index < treeNodes.length - 1 && (
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-px h-8 bg-gp-accent/30" />
                  )}
                </div>

                <div className="flex-1">
                  <div
                    data-testid={`spawn-layer-${node.level}-card`}
                    role="button"
                    tabIndex={isLocked ? -1 : 0}
                    onClick={() => {
                      if (!isLocked) {
                        onSelectSpawnLayer(node.level);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (isLocked) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectSpawnLayer(node.level);
                      }
                    }}
                    className={`w-full text-left mb-2 rounded-lg border px-2 py-1.5 ${cardClass} ${
                      isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-gp-mint shrink-0">
                          {node.title} (Lv.{node.level})
                        </span>
                      </div>
                      <span className="text-[11px] text-gp-mint/60">{nodeText}</span>
                    </div>
                    <p className="text-[11px] text-gp-mint/60 mt-0.5">{node.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {isLocked ? (
                      <>
                        <button
                          type="button"
                          data-testid={`spawn-layer-${node.level}-unlock-layer-btn`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!unlockDisabled) {
                              onUnlockSpawnLayer(node.level);
                            }
                          }}
                          disabled={unlockDisabled}
                            className={`${EMPTY_SLOT_CLASS} flex items-center justify-center gap-1 text-[11px] text-gp-mint/70 px-3 py-2 ${
                              unlockDisabled
                                ? 'border-gp-accent/20 text-gp-mint/40 cursor-not-allowed'
                                : 'border-emerald-300/90 bg-emerald-900/35 text-emerald-100 font-semibold hover:bg-emerald-900/45 cursor-pointer ring-1 ring-emerald-300/60 shadow-[0_0_14px_-4px_rgba(16,185,129,0.85)]'
                            }`}
                            style={EMPTY_SLOT_STYLE}
                          >
                            <span className="text-sm">🔒</span>
                          <span>
                            {!canUnlockNode
                              ? `Unlock Lv.${node.level - 1} first`
                              : isAffordable
                              ? `Unlock Lv.${node.level}`
                              : `Need ${unlockCost} points to unlock Lv.${node.level}`}
                          </span>
                        </button>
                      </>
                    ) : (
                      <>
                        {node.items.length === 0 ? (
                          <div className={`${EMPTY_SLOT_CLASS} col-span-full`} style={EMPTY_SLOT_STYLE} />
                        ) : (
                          node.items.slice(0, displayCount).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 bg-gp-bg/30 rounded-lg p-2 border border-gp-accent/20"
                            >
                              <span className="text-xl">{item.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gp-mint truncate">{item.name}</div>
                              </div>
                              <Badge
                                label={RARITY_LABELS[item.rarity] ?? '⭐'}
                                variant={RARITY_BADGE_MAP[item.rarity] ?? 'muted'}
                              />
                            </div>
                          ))
                        )}
                        {canUnlockItem ? (
                          <button
                            type="button"
                            data-testid={`spawn-layer-${node.level}-unlock-item-btn`}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (canUnlockItemNow) {
                                onUnlockSpawnLayerItem(node.level);
                              }
                            }}
                            disabled={!canUnlockItemNow}
                            className={`inline-flex items-center justify-start gap-2 text-xs px-3 py-2 rounded-lg border transition-all duration-200 ${
                              canUnlockItemNow
                                ? 'border-emerald-400/80 text-emerald-200 bg-gp-bg/30 hover:bg-emerald-900/30 cursor-pointer border border-emerald-300/75'
                                : 'border-gp-accent text-gp-mint cursor-not-allowed'
                            }`}
                          >
                            <span className="text-sm">✨</span>
                            Scout for Item (1pt)
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
