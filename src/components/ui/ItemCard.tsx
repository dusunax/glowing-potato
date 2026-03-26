// Displays a single inventory item with emoji, name, quantity, and rarity badge.

import { ITEMS } from '../../data/items';
import type { InventorySlot } from '../../types/inventory';
import { Badge } from './Badge';

interface ItemCardProps {
  slot: InventorySlot;
}

export function ItemCard({ slot }: ItemCardProps) {
  const item = ITEMS.find((i) => i.id === slot.itemId);
  if (!item) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center gap-3 hover:border-slate-500 transition-colors">
      <span className="text-3xl">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-100 truncate">{item.name}</div>
        <div className="text-xs text-slate-400 truncate">{item.description}</div>
        <Badge label={item.rarity} rarity={item.rarity} className="mt-1" />
      </div>
      <div className="text-2xl font-bold text-slate-300">×{slot.quantity}</div>
    </div>
  );
}
