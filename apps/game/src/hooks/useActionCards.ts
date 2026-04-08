// Hook managing the player's action card hand.
// Hand size: 4.
//   Slot 0 → always a move card (explore/sprint)
//   Slot 1 → always a forage card (forage/lucky_forage/windfall)
//   Slots 2–3 → skill cards (rest/scout/weather_shift)

import { useState, useCallback, useEffect } from 'react';
import type { ActionCard } from '../types/actionCard';
import { buildDeck, shuffleDeck, createSummonMonsterCard } from '../data/actionCards';

function isMoveCard(card: ActionCard): boolean {
  return card.type === 'explore' || card.type === 'sprint';
}

function isForageCard(card: ActionCard): boolean {
  return card.type === 'forage' || card.type === 'lucky_forage' || card.type === 'windfall';
}

function isSummonMonsterCard(card: ActionCard): boolean {
  return card.type === 'summon_monster';
}

const SKILL_HAND_SIZE = 2; // slots 2–3
const SUMMON_MONSTER_UNLOCK_DAY = 15;

interface UseActionCardsOptions {
  currentDay: number;
  hasUsedSummonMonster: boolean;
  onSummonMonsterUsed?: () => void;
  onDeckRefill?: (deckType: 'move' | 'forage' | 'skill') => void;
}

interface CardState {
  hand: ActionCard[];        // [move, forage, skill, skill]
  moveDeck: ActionCard[];
  moveDiscard: ActionCard[];
  forageDeck: ActionCard[];
  forageDiscard: ActionCard[];
  skillDeck: ActionCard[];
  skillDiscard: ActionCard[];
}

function hasSummonMonsterCard(state: CardState): boolean {
  return (
    state.hand.some(isSummonMonsterCard) ||
    state.moveDeck.some(isSummonMonsterCard) ||
    state.moveDiscard.some(isSummonMonsterCard) ||
    state.forageDeck.some(isSummonMonsterCard) ||
    state.forageDiscard.some(isSummonMonsterCard) ||
    state.skillDeck.some(isSummonMonsterCard) ||
    state.skillDiscard.some(isSummonMonsterCard)
  );
}

function stripSummonCardsFromState(state: CardState): CardState {
  return {
    ...state,
    moveDeck: state.moveDeck.filter((card) => !isSummonMonsterCard(card)),
    moveDiscard: state.moveDiscard.filter((card) => !isSummonMonsterCard(card)),
    forageDeck: state.forageDeck.filter((card) => !isSummonMonsterCard(card)),
    forageDiscard: state.forageDiscard.filter((card) => !isSummonMonsterCard(card)),
    skillDeck: state.skillDeck.filter((card) => !isSummonMonsterCard(card)),
    skillDiscard: state.skillDiscard.filter((card) => !isSummonMonsterCard(card)),
  };
}

export interface PlayCardOptions {
  preserveCard?: boolean;
}

type DeckType = 'move' | 'forage' | 'skill';

function drawOne(
  deck: ActionCard[],
  discard: ActionCard[],
  deckType: DeckType,
  onDeckRefill?: (deckType: DeckType) => void,
  rebuildDeck?: () => ActionCard[],
): [ActionCard | null, ActionCard[], ActionCard[]] {
  if (deck.length > 0) return [deck[0]!, deck.slice(1), discard];
  if (discard.length > 0) {
    const reshuffled = shuffleDeck(discard);
    return [reshuffled[0]!, reshuffled.slice(1), []];
  }
  if (rebuildDeck) {
    const replenished = shuffleDeck(rebuildDeck());
    if (replenished.length > 0) {
      if (onDeckRefill) onDeckRefill(deckType);
      return [replenished[0]!, replenished.slice(1), []];
    }
  }
  return [null, deck, discard];
}

function buildInitialState(currentDay: number, hasUsedSummonMonster: boolean): CardState {
  const full = shuffleDeck(buildDeck());
  const moveCards   = shuffleDeck(full.filter(isMoveCard));
  const forageCards = shuffleDeck(full.filter(isForageCard));
  const skillCards = shuffleDeck(
    full.filter((c) => !isMoveCard(c) && !isForageCard(c) && (!isSummonMonsterCard(c) || (currentDay >= SUMMON_MONSTER_UNLOCK_DAY && !hasUsedSummonMonster))),
  );

  const hand: ActionCard[] = [
    moveCards[0]!,
    forageCards[0]!,
    ...skillCards.slice(0, SKILL_HAND_SIZE),
  ];

  return {
    hand,
    moveDeck: moveCards.slice(1),
    moveDiscard: [],
    forageDeck: forageCards.slice(1),
    forageDiscard: [],
    skillDeck: skillCards.slice(SKILL_HAND_SIZE),
    skillDiscard: [],
  };
}

function buildMoveDeck(): ActionCard[] {
  const full = buildDeck();
  return shuffleDeck(full.filter(isMoveCard));
}

function buildForageDeck(): ActionCard[] {
  const full = buildDeck();
  return shuffleDeck(full.filter(isForageCard));
}

function buildSkillDeck(
  currentDay: number,
  hasUsedSummonMonster: boolean,
  forceIncludeSummon = false,
): ActionCard[] {
  const full = buildDeck();
  const summonEnabled = currentDay >= SUMMON_MONSTER_UNLOCK_DAY && !hasUsedSummonMonster;
  const baseDeck = full.filter(
    (c) => !isMoveCard(c) && !isForageCard(c) && (!isSummonMonsterCard(c) || summonEnabled),
  );
  const withSummon = summonEnabled && forceIncludeSummon && !baseDeck.some(isSummonMonsterCard);
  const finalDeck = withSummon ? [...baseDeck, createSummonMonsterCard()] : baseDeck;
  return shuffleDeck(finalDeck);
}

export function useActionCards({
  currentDay,
  hasUsedSummonMonster,
  onSummonMonsterUsed,
  onDeckRefill,
}: UseActionCardsOptions) {
  const [cardState, setCardState] = useState<CardState>(() =>
    buildInitialState(currentDay, hasUsedSummonMonster)
  );
  const [selectedCard, setSelectedCard] = useState<ActionCard | null>(null);

  useEffect(() => {
    const isUnlocking = currentDay >= SUMMON_MONSTER_UNLOCK_DAY;
    if (!isUnlocking || hasUsedSummonMonster) return;

    setCardState((prev) => {
      if (hasSummonMonsterCard(prev)) return prev;
      return {
        ...prev,
        skillDeck: [...prev.skillDeck, createSummonMonsterCard()],
      };
    });
  }, [currentDay, hasUsedSummonMonster]);

  const playCard = useCallback((cardId: string, options: PlayCardOptions = {}) => {
    const shouldPreserve = options.preserveCard === true;
    if (shouldPreserve) {
      setSelectedCard((prev) => (prev?.id === cardId ? null : prev));
      return;
    }

    setCardState((prev) => {
      const cardIndex = prev.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return prev;

      const card = prev.hand[cardIndex]!;

      let moveDeck = prev.moveDeck;
      let moveDiscard = prev.moveDiscard;
      let forageDeck = prev.forageDeck;
      let forageDiscard = prev.forageDiscard;
      let skillDeck = prev.skillDeck;
      let skillDiscard = prev.skillDiscard;

      let drawn: ActionCard | null;

      if (cardIndex === 0) {
        moveDiscard = [...moveDiscard, card];
        [drawn, moveDeck, moveDiscard] = drawOne(moveDeck, moveDiscard, 'move', onDeckRefill, () => buildMoveDeck());
      } else if (cardIndex === 1) {
        forageDiscard = [...forageDiscard, card];
        [drawn, forageDeck, forageDiscard] = drawOne(forageDeck, forageDiscard, 'forage', onDeckRefill, () => buildForageDeck());
      } else {
        const shouldRemoveSummonCard = isSummonMonsterCard(card);
        const usedSummon = shouldRemoveSummonCard || hasUsedSummonMonster;
        if (shouldRemoveSummonCard) {
          if (onSummonMonsterUsed) {
            onSummonMonsterUsed();
          }
          skillDeck = skillDeck.filter((c) => !isSummonMonsterCard(c));
          skillDiscard = skillDiscard.filter((c) => !isSummonMonsterCard(c));
          [drawn, skillDeck, skillDiscard] = drawOne(skillDeck, skillDiscard, 'skill', onDeckRefill, () => buildSkillDeck(currentDay, usedSummon, true));
        } else if (hasUsedSummonMonster) {
          const stateWithoutSummon = stripSummonCardsFromState({
            ...prev,
            moveDeck,
            moveDiscard,
            forageDeck,
            forageDiscard,
            skillDeck,
            skillDiscard,
          });
          skillDeck = stateWithoutSummon.skillDeck;
          skillDiscard = [...stateWithoutSummon.skillDiscard];
          [drawn, skillDeck, skillDiscard] = drawOne(skillDeck, skillDiscard, 'skill', onDeckRefill, () => buildSkillDeck(currentDay, true, true));
        } else {
          skillDiscard = [...skillDiscard, card];
          [drawn, skillDeck, skillDiscard] = drawOne(skillDeck, skillDiscard, 'skill', onDeckRefill, () => buildSkillDeck(currentDay, usedSummon, true));
        }
      }

      const newHand = [...prev.hand];
      if (drawn === null && cardIndex >= 2) {
        const skillFallback = buildSkillDeck(currentDay, hasUsedSummonMonster, true);
        if (skillFallback.length > 0) {
          drawn = skillFallback[0]!;
        }
      }

      if (drawn) {
        newHand[cardIndex] = drawn;
      } else {
        if (cardIndex >= 2) {
          const skillFallback = buildSkillDeck(currentDay, hasUsedSummonMonster, true);
          newHand[cardIndex] = skillFallback[0] ?? card;
        } else {
          newHand.splice(cardIndex, 1);
        }
      }

      return { hand: newHand, moveDeck, moveDiscard, forageDeck, forageDiscard, skillDeck, skillDiscard };
    });
    setSelectedCard(null);
  }, [currentDay, hasUsedSummonMonster, onDeckRefill, onSummonMonsterUsed]);

  const selectCard = useCallback((card: ActionCard | null) => {
    setSelectedCard((prev) => (prev?.id === card?.id ? null : card));
  }, []);

  return {
    hand: cardState.hand,
    selectedCard,
    selectCard,
    playCard,
    deckSize: cardState.moveDeck.length + cardState.forageDeck.length + cardState.skillDeck.length,
  };
}
