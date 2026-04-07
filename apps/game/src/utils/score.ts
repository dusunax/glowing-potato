import type { ItemRarity } from '../types/items';

const RARITY_POINTS: Record<ItemRarity, number> = {
  1: 1,
  2: 3,
  3: 5,
  4: 10,
  5: 15,
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
