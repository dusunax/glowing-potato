import type { ItemRarity } from '../types/items';

const RARITY_POINTS: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 3,
  rare: 5,
  legendary: 10,
};

export function calculateScore({
  survivalDays,
  level,
  totalXpGained,
  inventorySnapshot,
  getItemRarity,
}: {
  survivalDays: number;
  level: number;
  totalXpGained: number;
  inventorySnapshot: { itemId: string; quantity: number }[];
  getItemRarity: (itemId: string) => ItemRarity;
}): number {
  const survivalBonus = survivalDays * 50;
  const levelBonus = (level - 1) * 100;
  const xpBonus = totalXpGained * 3;
  const itemBonus = inventorySnapshot.reduce(
    (sum, slot) => sum + slot.quantity * RARITY_POINTS[getItemRarity(slot.itemId)],
    0
  );
  return survivalBonus + levelBonus + xpBonus + itemBonus;
}
