// Type definitions for action cards used during gameplay.

export type ActionCardType =
  | 'forage'        // Collect 1 item from current location
  | 'explore'       // Move to an adjacent tile (range 1)
  | 'sprint'        // Move up to 2 tiles away
  | 'rest'          // Advance time by 1 period
  | 'scout'         // Reveal spawnable items at adjacent tiles
  | 'lucky_forage'  // Collect 2 items with higher rare odds
  | 'weather_shift' // Change current weather randomly
  | 'windfall'      // Collect 3 items at once
  | 'attack';       // Attack an adjacent animal

export interface ActionCard {
  /** Unique instance id (for React keys and deduplication) */
  id: string;
  type: ActionCardType;
  name: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare';
  /** Applicable to move cards: how many tiles away the player can reach */
  moveRange?: number;
}
