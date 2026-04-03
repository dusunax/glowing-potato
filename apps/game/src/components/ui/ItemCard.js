// Displays a single inventory item with emoji, name, quantity, and rarity badge.
import { ITEMS } from '../../data/items';
import { Badge } from '@glowing-potato/ui';
const RARITY_BADGE_MAP = {
    common: 'muted',
    uncommon: 'success',
    rare: 'default',
    legendary: 'warning',
};
export function ItemCard({ slot }) {
    const item = ITEMS.find((i) => i.id === slot.itemId);
    if (!item)
        return null;
    return (<div className="bg-gp-bg/40 border border-gp-accent/20 rounded-lg p-3 flex items-center gap-3 hover:border-gp-accent/50 transition-colors">
      <span className="text-3xl">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gp-mint truncate">{item.name}</div>
        {/* Secondary description text — text-gp-mint/85 on dark bg: ~12:1 contrast ✓ */}
        <div className="text-xs text-gp-mint/85 truncate">{item.description}</div>
        <Badge label={item.rarity} variant={RARITY_BADGE_MAP[item.rarity] ?? 'muted'} className="mt-1"/>
      </div>
      {/* Quantity — full mint for maximum readability ✓ */}
      <div className="text-2xl font-bold text-gp-mint">×{slot.quantity}</div>
    </div>);
}
