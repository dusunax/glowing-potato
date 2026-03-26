// Shows which items can currently spawn given world conditions.

import { ITEMS } from '../../data/items';
import type { WorldConditions } from '../../types/conditions';
import { getSpawnableItems } from '../../utils/spawning';
import { Badge } from '../ui/Badge';

interface SpawnPanelProps {
  conditions: WorldConditions;
}

export function SpawnPanel({ conditions }: SpawnPanelProps) {
  const spawnable = getSpawnableItems(ITEMS, conditions);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold mb-1 text-slate-100">🌍 Spawnable Now</h2>
      <p className="text-xs text-slate-500 mb-3">{spawnable.length} item(s) available</p>
      {spawnable.length === 0 ? (
        <p className="text-slate-500 text-sm">Nothing spawns in these conditions.</p>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {spawnable.map((item) => (
            <div key={item.id} className="flex items-center gap-2 bg-slate-800 rounded-lg p-2 border border-slate-700">
              <span className="text-xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{item.name}</div>
              </div>
              <Badge label={item.rarity} rarity={item.rarity} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
