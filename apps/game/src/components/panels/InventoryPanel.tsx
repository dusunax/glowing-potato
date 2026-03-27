// Displays the player's current inventory as a scrollable grid of ItemCards.

import type { Inventory } from '../../types/inventory';
import { ItemCard } from '../ui/ItemCard';
import { CardTitle } from '@glowing-potato/ui';

interface InventoryPanelProps {
  inventory: Inventory;
}

export function InventoryPanel({ inventory }: InventoryPanelProps) {
  return (
    <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4 flex flex-col h-full">
      <CardTitle className="mb-3">🎒 Inventory</CardTitle>
      {inventory.length === 0 ? (
        <p className="text-gp-accent text-sm">No items yet. Go collect some!</p>
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
