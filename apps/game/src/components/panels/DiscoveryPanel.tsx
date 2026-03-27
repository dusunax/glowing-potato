// Shows all items as a journal — discovered ones glow, undiscovered are silhouettes.

import { ITEMS } from '../../data/items';
import type { ItemId } from '../../types/items';
import { Badge, CardTitle } from '@glowing-potato/ui';

interface DiscoveryPanelProps {
  discovered: Set<ItemId>;
}

const RARITY_BADGE_MAP: Record<string, 'default' | 'success' | 'warning' | 'muted'> = {
  common: 'muted',
  uncommon: 'success',
  rare: 'default',
  legendary: 'warning',
};

export function DiscoveryPanel({ discovered }: DiscoveryPanelProps) {
  return (
    <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4 flex flex-col h-full">
      <CardTitle className="mb-0.5">📖 Discovery Journal</CardTitle>
      <p className="text-xs text-gp-accent mb-3">{discovered.size}/{ITEMS.length} found</p>
      <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1">
        {ITEMS.map((item) => {
          const found = discovered.has(item.id);
          return (
            <div
              key={item.id}
              className={`rounded-lg p-2 border transition-all ${
                found
                  ? 'bg-gp-bg/40 border-gp-accent/30'
                  : 'bg-gp-bg/20 border-gp-accent/10 opacity-40'
              }`}
            >
              <div className="text-2xl mb-1">{found ? item.emoji : '❓'}</div>
              <div className="text-xs font-semibold text-gp-mint truncate">{found ? item.name : '???'}</div>
              {found && (
                <Badge
                  label={item.rarity}
                  variant={RARITY_BADGE_MAP[item.rarity] ?? 'muted'}
                  className="mt-1"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
