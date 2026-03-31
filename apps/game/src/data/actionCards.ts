// Static action card definitions and deck-building helpers.
// No logic — pure data + shuffle utility only.

import type { ActionCard, ActionCardType } from '../types/actionCard';

type CardTemplate = Omit<ActionCard, 'id'>;

/** Master list of card templates. */
const CARD_TEMPLATES: CardTemplate[] = [
  {
    type: 'forage',
    name: 'Forage',
    description: 'Search the area and collect one item.',
    emoji: '🌿',
    rarity: 'common',
  },
  {
    type: 'explore',
    name: 'Explore',
    description: 'Move to any adjacent tile on the map.',
    emoji: '🚶',
    rarity: 'common',
    moveRange: 1,
  },
  {
    type: 'rest',
    name: 'Rest',
    description: 'Take a break. Time advances by one period.',
    emoji: '⏳',
    rarity: 'common',
  },
  {
    type: 'lucky_forage',
    name: 'Lucky Forage',
    description: 'Search with extra luck. Collect 2 items with higher rare odds.',
    emoji: '🌟',
    rarity: 'uncommon',
  },
  {
    type: 'sprint',
    name: 'Sprint',
    description: 'Move quickly to a tile up to 2 steps away.',
    emoji: '🏃',
    rarity: 'uncommon',
    moveRange: 2,
  },
  {
    type: 'scout',
    name: 'Scout',
    description: 'Observe surroundings. Reveals spawnable items nearby.',
    emoji: '🔍',
    rarity: 'uncommon',
  },
  {
    type: 'weather_shift',
    name: 'Weather Shift',
    description: 'Invoke a change in the weather conditions.',
    emoji: '🌧️',
    rarity: 'rare',
  },
  {
    type: 'windfall',
    name: 'Windfall',
    description: 'A lucky windfall! Collect 3 items at once.',
    emoji: '💨',
    rarity: 'rare',
  },
];

/** Number of copies per rarity in the deck. */
const DECK_WEIGHTS: Record<string, number> = {
  common: 4,
  uncommon: 2,
  rare: 1,
};

let instanceCounter = 0;

function makeCard(template: CardTemplate): ActionCard {
  return { ...template, id: `card_${++instanceCounter}` };
}

/** Returns a fresh full deck (unsorted). */
export function buildDeck(): ActionCard[] {
  const deck: ActionCard[] = [];
  for (const template of CARD_TEMPLATES) {
    const count = DECK_WEIGHTS[template.rarity] ?? 1;
    for (let i = 0; i < count; i++) {
      deck.push(makeCard(template));
    }
  }
  return deck;
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffleDeck(deck: ActionCard[]): ActionCard[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export type { ActionCardType };
