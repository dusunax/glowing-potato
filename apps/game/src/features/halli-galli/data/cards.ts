// Card data for the Halli Galli mini-game.
// Each card shows a single fruit type with a count of 1–5.
// The bell should be rung when any fruit totals exactly 5 across
// all players' currently visible (top) cards.

export const FRUITS = ['strawberry', 'lemon', 'banana', 'plum'] as const;
export type Fruit = (typeof FRUITS)[number];

export const FRUIT_EMOJI: Record<Fruit, string> = {
  strawberry: '🍓',
  lemon: '🍋',
  banana: '🍌',
  plum: '🍇',
};

export const FRUIT_NAME_KO: Record<Fruit, string> = {
  strawberry: '딸기',
  lemon: '레몬',
  banana: '바나나',
  plum: '자두',
};

export interface Card {
  fruit: Fruit;
  count: number; // 1–5
}

/** Parse a card code string ("strawberry-3") into a Card. Returns null on invalid input. */
export function parseCard(code: string): Card | null {
  if (!code) return null;
  const dashIdx = code.lastIndexOf('-');
  if (dashIdx < 0) return null;
  const fruitStr = code.slice(0, dashIdx) as Fruit;
  const countStr = code.slice(dashIdx + 1);
  if (!FRUITS.includes(fruitStr)) return null;
  const count = parseInt(countStr, 10);
  if (Number.isNaN(count) || count < 1 || count > 5) return null;
  return { fruit: fruitStr, count };
}

/** Convert a Card to its string code ("strawberry-3"). */
export function cardToCode(card: Card): string {
  return `${card.fruit}-${card.count}`;
}

/**
 * Build a base deck of 20 cards: every fruit × every count (1–5).
 * This gives a balanced deck with exactly one card per combination.
 */
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const fruit of FRUITS) {
    for (let count = 1; count <= 5; count++) {
      deck.push({ fruit, count });
    }
  }
  return deck;
}

/** A minimal seeded PRNG (LCG) so each client can reproduce the same shuffle. */
function makeRng(seed: string): () => number {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (Math.imul(s, 31) + seed.charCodeAt(i)) >>> 0;
  }
  if (s === 0) s = 0xdeadbeef;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Fisher–Yates shuffle using the given seed string. */
export function shuffleDeck(deck: Card[], seed: string): Card[] {
  const rng = makeRng(seed);
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * Generate a deterministic shuffled deck for a player.
 * Using `roomSeed + playerId` ensures every player gets a different ordering
 * even within the same room.
 */
export function generatePlayerDeck(roomSeed: string, playerId: string): Card[] {
  return shuffleDeck(buildDeck(), roomSeed + playerId);
}

/** Calculate per-fruit totals from an array of card codes (skips nulls/undefined). */
export function calcFruitTotals(topCards: (string | null | undefined)[]): Record<Fruit, number> {
  const totals: Record<Fruit, number> = { strawberry: 0, lemon: 0, banana: 0, plum: 0 };
  for (const code of topCards) {
    if (!code) continue;
    const card = parseCard(code);
    if (!card) continue;
    totals[card.fruit] += card.count;
  }
  return totals;
}

/** Return the first fruit whose total equals exactly 5, or null if none. */
export function findWinningFruit(topCards: (string | null | undefined)[]): Fruit | null {
  const totals = calcFruitTotals(topCards);
  for (const fruit of FRUITS) {
    if (totals[fruit] === 5) return fruit;
  }
  return null;
}
