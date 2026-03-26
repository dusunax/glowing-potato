// Displays the player's current inventory as a scrollable grid of ItemCards.

import type { Inventory } from '../../types/inventory';
import { ItemCard } from '../ui/ItemCard';

interface InventoryPanelProps {
  inventory: Inventory;
}

export function InventoryPanel({ inventory }: InventoryPanelProps) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold mb-3 text-slate-100">🎒 Inventory</h2>
      {inventory.length === 0 ? (
        <p className="text-slate-500 text-sm">No items yet. Go collect some!</p>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {inventory.map((slot) => (
            <ItemCard key={slot.itemId} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
}
