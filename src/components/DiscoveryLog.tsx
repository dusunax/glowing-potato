import type { DiscoveryEntry } from '../types/game';
import { ITEMS } from '../data/items';

interface Props {
  discoveries: DiscoveryEntry[];
  log: string[];
}

const RARITY_COLOR: Record<string, string> = {
  common: 'text-gray-300',
  uncommon: 'text-green-300',
  rare: 'text-blue-300',
  legendary: 'text-yellow-300',
};

export function DiscoveryLog({ discoveries, log }: Props) {
  return (
    <div className="bg-teal-950/60 border-2 border-teal-700 rounded p-3 space-y-3">
      <h2 className="text-teal-300 text-xs font-pixel border-b border-teal-700 pb-2">
        📖 Journal
      </h2>

      {/* Activity Log */}
      <div>
        <div className="text-teal-400 text-xs font-pixel mb-2">Activity</div>
        <div className="bg-black/30 rounded p-2 h-28 overflow-y-auto space-y-1">
          {log.map((entry, i) => (
            <div key={i} className="text-xxxs font-pixel text-gray-300">
              {entry}
            </div>
          ))}
        </div>
      </div>

      {/* Discovery Codex */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-teal-400 text-xs font-pixel">Discoveries</div>
          <div className="text-teal-600 text-xs font-pixel">{discoveries.length} found</div>
        </div>
        <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
          {discoveries.map(entry => {
            const item = ITEMS.find(i => i.id === entry.itemId);
            if (!item) return null;
            return (
              <div
                key={entry.id}
                className="bg-teal-900/30 border border-teal-700/50 rounded p-2"
                title={`${item.description}\nFound: Day ${entry.discoveredAt.dayCount}, ${entry.discoveredAt.timeOfDay} in ${entry.discoveredAt.season}`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-sm">{item.emoji}</span>
                  <span className={`text-xxs font-pixel ${RARITY_COLOR[item.rarity]}`}>
                    {item.name}
                  </span>
                </div>
                <div className="text-gray-500 font-pixel text-xxs">
                  Day {entry.discoveredAt.dayCount} • {entry.discoveredAt.season}
                </div>
              </div>
            );
          })}
          {discoveries.length === 0 && (
            <div className="col-span-2 text-gray-600 text-xs font-pixel italic text-center py-2">
              No discoveries yet...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
