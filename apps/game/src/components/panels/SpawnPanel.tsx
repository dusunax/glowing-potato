// Shows which items can currently spawn given world conditions.

import { ITEMS } from '../../data/items';
import type { WorldConditions } from '../../types/conditions';
import { Badge, CardTitle } from '@glowing-potato/ui';
import {
  getSpawnableItems,
  getBaseSpawnableItems,
  getMaxUnlockedSpawnLayer,
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
  selectedSpawnLayer: number;
  onSelectSpawnLayer: (layer: number) => void;
}

const TREE_LEVEL_LABELS: Record<number, { title: string; subtitle: string }> = {
  0: { title: 'Foundation Layer', subtitle: 'Basic resources that can appear anytime' },
  1: { title: 'Root Layer', subtitle: 'Shallow foraging zone' },
  2: { title: 'Brush Layer', subtitle: 'Wild shrubs and roots' },
  3: { title: 'Canopy Layer', subtitle: 'Mixed flora and mineral pockets' },
  4: { title: 'Deep Layer', subtitle: 'Rare finds begin to emerge' },
  5: { title: 'Apex Layer', subtitle: 'Treasure-level resources' },
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
  selectedSpawnLayer,
  onSelectSpawnLayer,
}: SpawnPanelProps) {
  const revealLevel = Math.min(Math.max(1, scoutRevealLevel), MAX_SPAWN_REVEAL_LEVEL);
  const baseSpawnable = getBaseSpawnableItems(ITEMS);
  const spawnable = [...baseSpawnable, ...getSpawnableItems(ITEMS, conditions, revealLevel, biomeType)];
  const unlockedLayer = getMaxUnlockedSpawnLayer(scoutPoints);
  const activeScoutLevel = Math.max(0, scoutPoints);
  const baseNode: SpawnTreeNode = {
    level: 0,
    title: TREE_LEVEL_LABELS[0].title,
    subtitle: TREE_LEVEL_LABELS[0].subtitle,
    unlocked: true,
    items: baseSpawnable,
  };
  const treeNodes: SpawnTreeNode[] = [
    baseNode,
    ...Array.from({ length: MAX_SPAWN_REVEAL_LEVEL }, (_, index) => {
      const level = index + 1;
      const isUnlocked = level <= unlockedLayer;
      const unlockedNow = getSpawnableItems(ITEMS, conditions, level, biomeType);
      const unlockedBefore = level > 1 ? getSpawnableItems(ITEMS, conditions, level - 1, biomeType) : [];
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
    <div className="flex flex-col">
      <CardTitle className="mb-0.5">🌍 Spawnable Now</CardTitle>
      <p className="text-xs text-gp-mint/70 mb-1">
        {spawnable.length} item(s) available
      </p>
      <p className="text-[11px] text-gp-mint/50 mb-3">
        Scout points: {activeScoutLevel} • Unlock level: {unlockedLayer}/{MAX_SPAWN_REVEAL_LEVEL}
      </p>
      <div className="space-y-3 overflow-y-auto">
        {treeNodes.map((node, index) => {
                    const isLocked = !node.unlocked;
                    const isSelected = selectedSpawnLayer === node.level;
                    const requiredPoints = node.level === 0 ? 0 : SPAWN_LAYER_UNLOCK_COST_BY_LEVEL[node.level] ?? 0;
                    const nodeText = isLocked ? `Need ${requiredPoints} points` : `${node.items.length} unlocked`;
                    const cardClass = isSelected
                      ? 'border-gp-mint/80 bg-gp-mint/10'
                      : 'border-gp-accent/30 bg-gp-bg/30';

          return (
            <div key={`spawn-tree-${node.level}`} className="relative">
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
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLocked) {
                        onSelectSpawnLayer(node.level);
                      }
                    }}
                    className={`w-full text-left mb-2 rounded-lg border px-2 py-1.5 ${cardClass} ${
                      isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    }`}
                    disabled={isLocked}
                  >
                    <div className="flex justify-between gap-2">
                      <div className="text-sm font-semibold text-gp-mint">
                        {node.title} (Lv.{node.level})
                      </div>
                      <span className="text-[11px] text-gp-mint/60">{nodeText}</span>
                    </div>
                    <p className="text-[11px] text-gp-mint/60 mt-0.5">{node.subtitle}</p>
                  </button>

                  {isLocked ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Array.from({ length: 2 }).map((_, emptyIndex) => (
                        <div
                          key={`locked-${node.level}-${emptyIndex}`}
                          className={EMPTY_SLOT_CLASS}
                          style={EMPTY_SLOT_STYLE}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {node.items.length === 0 ? (
                        <div className={`${EMPTY_SLOT_CLASS} col-span-full`} style={EMPTY_SLOT_STYLE} />
                      ) : (
                        node.items.map((item) => (
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
