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
    <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4 flex flex-col h-full">
      <CardTitle className="mb-0.5">🌍 Spawnable Now</CardTitle>
      <p className="text-xs text-gp-accent mb-3">{spawnable.length} item(s) available</p>
      {spawnable.length === 0 ? (
        <p className="text-gp-accent text-sm">Nothing spawns in these conditions.</p>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
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
