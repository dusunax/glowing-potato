import type { InventoryItem } from '../types/game';
import { ITEMS } from '../data/items';
import { RECIPES } from '../data/recipes';

interface Props {
  inventory: InventoryItem[];
}

const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-800/60 border-gray-600',
  uncommon: 'bg-green-900/60 border-green-600',
  rare: 'bg-blue-900/60 border-blue-500',
  legendary: 'bg-yellow-900/60 border-yellow-500',
};

const CRAFTED_IDS = RECIPES.map(r => r.output.itemId);

export function InventoryPanel({ inventory }: Props) {
  const collected = inventory.filter(i => !CRAFTED_IDS.includes(i.itemId));
  const crafted = inventory.filter(i => CRAFTED_IDS.includes(i.itemId));

  const renderItem = (invItem: InventoryItem) => {
    const item = ITEMS.find(i => i.id === invItem.itemId);
    if (!item) {
      const recipe = RECIPES.find(r => r.output.itemId === invItem.itemId);
      return (
        <div
          key={invItem.itemId}
          className="bg-purple-900/60 border border-purple-500 rounded p-2 flex flex-col items-center gap-1"
          title={recipe?.description}
        >
          <span className="text-lg">{recipe?.emoji || '📦'}</span>
          <span className="text-purple-300 text-xs font-pixel text-center leading-tight">
            {recipe?.name || invItem.itemId}
          </span>
          <span className="text-yellow-300 text-xs font-pixel">×{invItem.quantity}</span>
        </div>
      );
    }
    return (
      <div
        key={invItem.itemId}
        className={`border rounded p-2 flex flex-col items-center gap-1 ${RARITY_BG[item.rarity]}`}
        title={`${item.name}\n${item.description}\nRarity: ${item.rarity}`}
      >
        <span className="text-lg">{item.emoji}</span>
        <span className="text-gray-200 text-xs font-pixel text-center leading-tight" style={{fontSize: '8px'}}>
          {item.name}
        </span>
        <span className="text-yellow-300 text-xs font-pixel">×{invItem.quantity}</span>
      </div>
    );
  };

  return (
    <div className="bg-amber-950/60 border-2 border-amber-700 rounded p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-amber-300 text-xs font-pixel">🎒 Inventory</h2>
        <span className="text-amber-500 text-xs font-pixel">{inventory.length} types</span>
      </div>

      {inventory.length === 0 ? (
        <div className="text-gray-500 text-xs font-pixel italic text-center py-4">
          Your bag is empty... Go explore!
        </div>
      ) : (
        <>
          {collected.length > 0 && (
            <div>
              <div className="text-green-400 text-xs font-pixel mb-2">Collected</div>
              <div className="grid grid-cols-3 gap-1">
                {collected.map(renderItem)}
              </div>
            </div>
          )}
          {crafted.length > 0 && (
            <div>
              <div className="text-purple-400 text-xs font-pixel mb-2">Crafted</div>
              <div className="grid grid-cols-3 gap-1">
                {crafted.map(renderItem)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
