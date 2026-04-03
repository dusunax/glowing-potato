const RARITY_POINTS = {
    common: 1,
    uncommon: 3,
    rare: 5,
    legendary: 10,
};
export function calculateScore({ survivalDays, level, totalXpGained, inventorySnapshot, getItemRarity, }) {
    const survivalBonus = survivalDays * 50;
    const levelBonus = (level - 1) * 100;
    const xpBonus = totalXpGained * 3;
    const itemBonus = inventorySnapshot.reduce((sum, slot) => sum + slot.quantity * RARITY_POINTS[getItemRarity(slot.itemId)], 0);
    return survivalBonus + levelBonus + xpBonus + itemBonus;
}
