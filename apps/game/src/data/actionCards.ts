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
    rarity: 1,
  },
  {
    type: 'explore',
    name: 'Explore',
    description: 'Move to any adjacent tile on the map.',
    emoji: '🚶',
    rarity: 1,
    moveRange: 1,
  },
  {
    type: 'rest',
    name: 'Rest',
    description: 'Take a break. Time advances by one period.',
    emoji: '⏳',
    rarity: 1,
  },
  {
    type: 'lucky_forage',
    name: 'Lucky Forage',
    description: 'Search with extra luck. Collect 2 items with higher rare odds.',
    emoji: '🌟',
    rarity: 2,
  },
  {
    type: 'sprint',
    name: 'Sprint',
    description: 'Move quickly to a tile up to 2 steps away.',
    emoji: '🏃',
    rarity: 2,
    moveRange: 2,
  },
  {
    type: 'scout',
    name: 'Scout',
    description: 'Observe surroundings. Reveals spawnable items nearby.',
    emoji: '🔍',
    rarity: 2,
  },
  {
    type: 'weather_shift',
    name: 'Weather Shift',
    description: 'Invoke a change in the weather conditions.',
    emoji: '🌧️',
    rarity: 3,
  },
  {
    type: 'summon_monster',
    name: 'Summon Monster',
    description: 'Summon a wave of creatures from the cave.',
    emoji: '🩸',
    rarity: 5,
  },
  {
    type: 'windfall',
    name: 'Windfall',
    description: 'A lucky windfall! Collect 3 items at once.',
    emoji: '💨',
    rarity: 3,
  },
];

/** Number of copies per rarity in the deck. */
const DECK_WEIGHTS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 3,
  2: 2,
  3: 1,
  4: 1,
  5: 1,
};

let instanceCounter = 0;

function makeCard(template: CardTemplate): ActionCard {
  return { ...template, id: `card_${++instanceCounter}` };
}

/** Returns a fresh full deck (unsorted). */
export function buildDeck(): ActionCard[] {
  const deck: ActionCard[] = [];
for (const template of CARD_TEMPLATES) {
    const count = DECK_WEIGHTS[template.rarity];
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

export function createSummonMonsterCard(): ActionCard {
  return {
    type: 'summon_monster',
    name: 'Summon Monster',
    description: 'Summon a wave of creatures from the cave.',
    emoji: '🩸',
    rarity: 5,
    id: `card_${++instanceCounter}`,
  };
}

export type { ActionCardType };
