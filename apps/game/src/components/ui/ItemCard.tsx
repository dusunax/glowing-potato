// Displays a single inventory item with emoji, name, quantity, and rarity badge.

import { ITEMS } from '../../data/items';
import type { InventorySlot } from '../../types/inventory';
import { Badge } from '@glowing-potato/ui';
import type { ItemRarity } from '../../types/items';

const RARITY_BADGE_MAP: Record<ItemRarity, 'default' | 'success' | 'warning' | 'muted' | 'danger'> = {
  1: 'muted',
  2: 'success',
  3: 'default',
  4: 'warning',
  5: 'danger',
};
const RARITY_LABELS: Record<ItemRarity, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '⭐⭐⭐⭐⭐',
};

interface ItemCardProps {
  slot: InventorySlot;
}

export function ItemCard({ slot }: ItemCardProps) {
  const item = ITEMS.find((i) => i.id === slot.itemId);
  if (!item) return null;
  const weaponAttackPower = item.attackPower;

  return (
    <div className="bg-gp-bg/40 border border-gp-accent/20 rounded-lg p-3 flex items-center gap-3 hover:border-gp-accent/50 transition-colors">
      <span className="text-3xl">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gp-mint truncate">{item.name}</div>
        {/* Secondary description text — text-gp-mint/85 on dark bg: ~12:1 contrast ✓ */}
        <div className="text-xs text-gp-mint/85 truncate">{item.description}</div>
        {weaponAttackPower != null ? (
          <div className="text-xs text-gp-mint/80 mt-1">
            ⚔️ Boosts your melee attack by +{weaponAttackPower}
          </div>
        ) : null}
        <Badge
          label={RARITY_LABELS[item.rarity] ?? '⭐'}
          variant={RARITY_BADGE_MAP[item.rarity] ?? 'muted'}
          className="mt-1"
        />
      </div>
      {/* Quantity — full mint for maximum readability ✓ */}
      <div className="text-2xl font-bold text-gp-mint">×{slot.quantity}</div>
    </div>
  );
}
