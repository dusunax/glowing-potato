// Displays the player's current inventory as a scrollable grid of ItemCards.

import type { Inventory } from '../../types/inventory';
import { ItemCard } from '../ui/ItemCard';
import { CardTitle } from '@glowing-potato/ui';

interface InventoryPanelProps {
  inventory: Inventory;
}

export function InventoryPanel({ inventory }: InventoryPanelProps) {
  return (
    <div className="flex flex-col">
      <CardTitle className="mb-3">🎒 Inventory</CardTitle>
      {inventory.length === 0 ? (
        // text-gp-mint/85 on gp-surface: ~4.55:1 — passes WCAG AA ✓
        <p className="text-gp-mint/85 text-sm">No items yet. Go collect some!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-72">
          {inventory.map((slot) => (
            <ItemCard key={slot.itemId} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
}
