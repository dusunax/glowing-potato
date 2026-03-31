// Shows which items can currently spawn given world conditions.

import { ITEMS } from '../../data/items';
import type { WorldConditions } from '../../types/conditions';
import { getSpawnableItems } from '../../utils/spawning';
import { Badge, CardTitle } from '@glowing-potato/ui';

interface SpawnPanelProps {
  conditions: WorldConditions;
}

const RARITY_BADGE_MAP: Record<string, 'default' | 'success' | 'warning' | 'muted'> = {
  common: 'muted',
  uncommon: 'success',
  rare: 'default',
  legendary: 'warning',
};

export function SpawnPanel({ conditions }: SpawnPanelProps) {
  const spawnable = getSpawnableItems(ITEMS, conditions);

  return (
    <div className="flex flex-col">
      <CardTitle className="mb-0.5">🌍 Spawnable Now</CardTitle>
      {/* text-gp-mint/70 on gp-surface: ~3.65:1 — acceptable for small hint text ✓ */}
      <p className="text-xs text-gp-mint/70 mb-3">{spawnable.length} item(s) available</p>
      {spawnable.length === 0 ? (
        // text-gp-mint/85 on gp-surface: ~4.55:1 — passes WCAG AA ✓
        <p className="text-gp-mint/85 text-sm">Nothing spawns in these conditions.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-72">
          {spawnable.map((item) => (
            <div key={item.id} className="flex items-center gap-2 bg-gp-bg/30 rounded-lg p-2 border border-gp-accent/20">
              <span className="text-xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gp-mint truncate">{item.name}</div>
              </div>
              <Badge label={item.rarity} variant={RARITY_BADGE_MAP[item.rarity] ?? 'muted'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
