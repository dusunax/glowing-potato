// Shows all items as a journal — discovered ones glow, undiscovered are silhouettes.

import { ITEMS } from '../../data/items';
import type { ItemId } from '../../types/items';
import { Badge } from '../ui/Badge';

interface DiscoveryPanelProps {
  discovered: Set<ItemId>;
}

export function DiscoveryPanel({ discovered }: DiscoveryPanelProps) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold mb-1 text-slate-100">📖 Discovery Journal</h2>
      <p className="text-xs text-slate-500 mb-3">{discovered.size}/{ITEMS.length} found</p>
      <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1">
        {ITEMS.map((item) => {
          const found = discovered.has(item.id);
          return (
            <div
              key={item.id}
              className={`rounded-lg p-2 border transition-all ${
                found
                  ? 'bg-slate-800 border-slate-600'
                  : 'bg-slate-900 border-slate-800 opacity-40'
              }`}
            >
              <div className="text-2xl mb-1">{found ? item.emoji : '❓'}</div>
              <div className="text-xs font-semibold truncate">{found ? item.name : '???'}</div>
              {found && <Badge label={item.rarity} rarity={item.rarity} className="mt-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
