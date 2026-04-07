export interface AnimalRecord {
  name: string;
  emoji: string;
  rarity: 1 | 2 | 3 | 4 | 5;
  count: number;
}

export interface GameRecord {
  id?: string;
  userId: string;
  nickname?: string;
  gameId?: string;
  score: number;
  survivalDays: number;
  level: number;
  totalXpGained: number;
  defeatedAnimals: AnimalRecord[];
  inventorySnapshot: { itemId: string; quantity: number }[];
  createdAt: number;
}
