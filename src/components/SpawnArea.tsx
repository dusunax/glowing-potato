import type { WorldConditions, Item } from '../types/game';
import { ITEMS } from '../data/items';

interface Props {
  conditions: WorldConditions;
  onCollect: () => void;
}

function conditionsMatch(item: Item, conditions: WorldConditions): boolean {
  const { season, weather, timeOfDay } = conditions;
  const { spawnCondition } = item;
  if (spawnCondition.seasons && !spawnCondition.seasons.includes(season)) return false;
  if (spawnCondition.weathers && !spawnCondition.weathers.includes(weather)) return false;
  if (spawnCondition.timeOfDay && !spawnCondition.timeOfDay.includes(timeOfDay)) return false;
  return true;
}

const RARITY_COLOR: Record<string, string> = {
  common: 'text-gray-300',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  legendary: 'text-yellow-400',
};

export function SpawnArea({ conditions, onCollect }: Props) {
  const availableItems = ITEMS.filter(item =>
    item.category !== 'crafted' && conditionsMatch(item, conditions)
  );

  const timeEmoji: Record<string, string> = {
    dawn: '🌅', morning: '🌤️', afternoon: '🌞',
    dusk: '🌆', night: '🌙', midnight: '⭐'
  };

  return (
    <div className="bg-green-950/60 border-2 border-green-700 rounded p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-green-300 text-xs font-pixel">
          {timeEmoji[conditions.timeOfDay]} Grove Clearing
        </h2>
        <span className="text-green-500 text-xs font-pixel">
          {availableItems.length} available
        </span>
      </div>

      {availableItems.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {availableItems.map(item => (
            <div
              key={item.id}
              className="bg-green-900/40 border border-green-700/50 rounded px-2 py-1 text-xs font-pixel"
              title={`${item.name} (${item.rarity})\n${item.description}`}
            >
              <span className={RARITY_COLOR[item.rarity]}>
                {item.emoji}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-xs font-pixel italic text-center py-4">
          Nothing grows here right now...
        </div>
      )}

      <p className="text-green-600 text-xs font-pixel italic">
        Hover items to preview • Click Explore to collect
      </p>

      <button
        onClick={onCollect}
        className="w-full pixel-btn bg-green-800 hover:bg-green-700 text-green-100 text-xs font-pixel py-3 rounded border-2 border-green-500 transition-colors"
      >
        🌿 Explore the Grove
      </button>
    </div>
  );
}
