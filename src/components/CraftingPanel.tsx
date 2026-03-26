import type { InventoryItem } from '../types/game';
import { ITEMS } from '../data/items';
import { RECIPES } from '../data/recipes';

interface Props {
  inventory: InventoryItem[];
  canCraft: (id: string) => boolean;
  onCraft: (id: string) => void;
}

export function CraftingPanel({ inventory, canCraft, onCraft }: Props) {
  const getQuantity = (itemId: string) =>
    inventory.find(i => i.itemId === itemId)?.quantity ?? 0;

  const getItem = (itemId: string) => ITEMS.find(i => i.id === itemId);

  return (
    <div className="bg-purple-950/60 border-2 border-purple-700 rounded p-3 space-y-3">
      <h2 className="text-purple-300 text-xs font-pixel border-b border-purple-700 pb-2">
        🔨 Crafting Table
      </h2>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {RECIPES.map(recipe => {
          const craftable = canCraft(recipe.id);
          return (
            <div
              key={recipe.id}
              className={`border rounded p-2 transition-all ${
                craftable
                  ? 'bg-purple-900/60 border-purple-500'
                  : 'bg-gray-900/40 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-xs font-pixel">
                  {recipe.emoji} {recipe.name}
                </span>
                <button
                  onClick={() => onCraft(recipe.id)}
                  disabled={!craftable}
                  className={`pixel-btn text-xs font-pixel px-2 py-1 rounded transition-colors ${
                    craftable
                      ? 'bg-purple-700 hover:bg-purple-600 text-white border-purple-400'
                      : 'bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed'
                  }`}
                >
                  Craft
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {recipe.inputs.map(input => {
                  const item = getItem(input.itemId);
                  const have = getQuantity(input.itemId);
                  const enough = have >= input.quantity;
                  return (
                    <span
                      key={input.itemId}
                      className={`text-xxxs font-pixel rounded px-1 py-0.5 ${
                        enough ? 'text-green-300 bg-green-900/40' : 'text-red-300 bg-red-900/40'
                      }`}
                    >
                      {item?.emoji || '?'} ×{input.quantity} ({have})
                    </span>
                  );
                })}
              </div>
              <div className="text-gray-500 mt-1 text-xxxs font-mono">
                → {recipe.emoji} {recipe.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
