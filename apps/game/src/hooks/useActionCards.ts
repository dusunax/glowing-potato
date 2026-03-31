// Hook managing the player's action card hand.
// Keeps hand size at 3; draws from a shuffled deck, reshuffling discards when empty.

import { useState, useCallback } from 'react';
import type { ActionCard } from '../types/actionCard';
import { buildDeck, shuffleDeck } from '../data/actionCards';

const HAND_SIZE = 3;

interface CardState {
  hand: ActionCard[];
  deck: ActionCard[];
  discard: ActionCard[];
}

function buildInitialState(): CardState {
  const full = shuffleDeck(buildDeck());
  return {
    hand: full.slice(0, HAND_SIZE),
    deck: full.slice(HAND_SIZE),
    discard: [],
  };
}

export function useActionCards() {
  const [cardState, setCardState] = useState<CardState>(buildInitialState);
  const [selectedCard, setSelectedCard] = useState<ActionCard | null>(null);

  /** Draw one card from a deck array; returns [drawn, remaining]. Reshuffles discards when deck is empty. */
  function drawOne(deck: ActionCard[], discard: ActionCard[]): [ActionCard | null, ActionCard[], ActionCard[]] {
    if (deck.length > 0) {
      return [deck[0]!, deck.slice(1), discard];
    }
    if (discard.length > 0) {
      const reshuffled = shuffleDeck(discard);
      return [reshuffled[0]!, reshuffled.slice(1), []];
    }
    return [null, deck, discard];
  }

  /** Discard a card by id and replace it with the next draw. */
  const playCard = useCallback((cardId: string) => {
    setCardState((prev) => {
      const cardIndex = prev.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return prev;

      const card = prev.hand[cardIndex]!;
      const updatedDiscard = [...prev.discard, card];
      const [drawn, newDeck, newDiscard] = drawOne(prev.deck, updatedDiscard);

      const newHand = [...prev.hand];
      if (drawn) {
        newHand[cardIndex] = drawn;
      } else {
        newHand.splice(cardIndex, 1);
      }

      return { hand: newHand, deck: newDeck, discard: newDiscard };
    });
    setSelectedCard(null);
  }, []);

  /**
   * Select a card (for targeted actions like Explore/Sprint).
   * Calling with the already-selected card toggles it off.
   */
  const selectCard = useCallback((card: ActionCard | null) => {
    setSelectedCard((prev) => (prev?.id === card?.id ? null : card));
  }, []);

  return {
    hand: cardState.hand,
    selectedCard,
    selectCard,
    playCard,
    deckSize: cardState.deck.length,
  };
}
