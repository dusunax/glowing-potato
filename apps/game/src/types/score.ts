export interface AnimalRecord {
  name: string;
  emoji: string;
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
