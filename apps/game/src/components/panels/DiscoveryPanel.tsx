// Shows all items as a journal — discovered ones glow, undiscovered are silhouettes.

import { ITEMS } from '../../data/items';
import type { ItemId } from '../../types/items';
import { Badge, CardTitle } from '@glowing-potato/ui';
import type { ItemRarity } from '../../types/items';
import { getItemSpawnHint } from '../../utils/itemHint';

interface DiscoveryPanelProps {
  discovered: Set<ItemId>;
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

export function DiscoveryPanel({ discovered }: DiscoveryPanelProps) {
  return (
    <div className="flex flex-col" data-testid="discovery-panel">
      <CardTitle className="mb-0.5">📖 Discovery Journal</CardTitle>
      {/* text-gp-mint/70 on gp-surface: ~3.65:1 — acceptable for uppercase tracking hint ✓ */}
      <p className="text-xs text-gp-mint/70 mb-3">{discovered.size}/{ITEMS.length} found</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 overflow-y-auto">
        {ITEMS.map((item) => {
          const found = discovered.has(item.id);
          const tooltip = found ? getItemSpawnHint(item) : 'Undiscovered item';
          return (
            <div
              key={item.id}
              data-testid={`discovery-item-${item.id}`}
              data-state={found ? 'found' : 'undiscovered'}
              className={`relative rounded-lg p-2 border transition-all ${
                found
                  ? 'bg-gp-bg/40 border-gp-accent/30'
                : 'bg-gp-bg/20 border-gp-accent/10 opacity-40'
              }`}
            >
              <div
                className="absolute right-1.5 top-1.5 text-[10px] text-gp-mint/55 tabular-nums"
                data-testid={`discovery-item-no-${item.id}`}
              >
                #{item.itemNo ?? '-'}
              </div>
              <div className="text-2xl mb-1">{found ? item.emoji : '❓'}</div>
              <div className="text-xs font-semibold text-gp-mint truncate">{found ? item.name : '???'}</div>
              {found && (
                <>
                  <Badge
                    label={RARITY_LABELS[item.rarity] ?? '⭐'}
                    variant={RARITY_BADGE_MAP[item.rarity] ?? 'muted'}
                    className="mt-1"
                  />
                  <div className="text-[10px] text-gp-mint/70 mt-1 break-words">{tooltip}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
