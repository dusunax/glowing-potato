import { describe, expect, it } from 'vitest';
import { calculateScore } from './score';
import type { ItemRarity } from '../types/items';

const rarityById: Record<string, ItemRarity> = {
  wood: 1,
  herb: 3,
  relic: 5,
};

describe('calculateScore', () => {
  it('sums survival, level, xp, and inventory rarity bonuses', () => {
    const score = calculateScore({
      survivalDays: 4,
      level: 3,
      totalXpGained: 7,
      inventorySnapshot: [
        { itemId: 'wood', quantity: 2 },
        { itemId: 'herb', quantity: 1 },
        { itemId: 'relic', quantity: 1 },
      ],
      getItemRarity: (itemId) => rarityById[itemId],
    });

    expect(score).toBe(4 * 50 + 2 * 100 + 7 * 3 + 2 * 1 + 1 * 5 + 1 * 15);
  });

  it('handles empty inventory with only base score components', () => {
    const score = calculateScore({
      survivalDays: 1,
      level: 1,
      totalXpGained: 0,
      inventorySnapshot: [],
      getItemRarity: () => 1,
    });

    expect(score).toBe(1 * 50 + 0 * 100 + 0 * 3 + 0);
  });

  it('accumulates item rarity by stack quantity', () => {
    const score = calculateScore({
      survivalDays: 0,
      level: 1,
      totalXpGained: 0,
      inventorySnapshot: [
        { itemId: 'herb', quantity: 2 },
      ],
      getItemRarity: (itemId) => rarityById[itemId],
    });

    expect(score).toBe(2 * 5);
  });
});
