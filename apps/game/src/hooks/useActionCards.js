// Hook managing the player's action card hand.
// Hand size: 4.
//   Slot 0 → always a move card (explore/sprint)
//   Slot 1 → always a forage card (forage/lucky_forage/windfall)
//   Slots 2–3 → skill cards (rest/scout/weather_shift)
import { useState, useCallback } from 'react';
import { buildDeck, shuffleDeck } from '../data/actionCards';
function isMoveCard(card) {
    return card.type === 'explore' || card.type === 'sprint';
}
function isForageCard(card) {
    return card.type === 'forage' || card.type === 'lucky_forage' || card.type === 'windfall';
}
const SKILL_HAND_SIZE = 2; // slots 2–3
function drawOne(deck, discard) {
    if (deck.length > 0)
        return [deck[0], deck.slice(1), discard];
    if (discard.length > 0) {
        const reshuffled = shuffleDeck(discard);
        return [reshuffled[0], reshuffled.slice(1), []];
    }
    return [null, deck, discard];
}
function buildInitialState() {
    const full = shuffleDeck(buildDeck());
    const moveCards = shuffleDeck(full.filter(isMoveCard));
    const forageCards = shuffleDeck(full.filter(isForageCard));
    const skillCards = shuffleDeck(full.filter((c) => !isMoveCard(c) && !isForageCard(c)));
    const hand = [
        moveCards[0],
        forageCards[0],
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
export function useActionCards() {
    const [cardState, setCardState] = useState(buildInitialState);
    const [selectedCard, setSelectedCard] = useState(null);
    const playCard = useCallback((cardId, options = {}) => {
        const shouldPreserve = options.preserveCard === true;
        if (shouldPreserve) {
            setSelectedCard((prev) => (prev?.id === cardId ? null : prev));
            return;
        }
        setCardState((prev) => {
            const cardIndex = prev.hand.findIndex((c) => c.id === cardId);
            if (cardIndex === -1)
                return prev;
            const card = prev.hand[cardIndex];
            let moveDeck = prev.moveDeck;
            let moveDiscard = prev.moveDiscard;
            let forageDeck = prev.forageDeck;
            let forageDiscard = prev.forageDiscard;
            let skillDeck = prev.skillDeck;
            let skillDiscard = prev.skillDiscard;
            let drawn;
            if (cardIndex === 0) {
                moveDiscard = [...moveDiscard, card];
                [drawn, moveDeck, moveDiscard] = drawOne(moveDeck, moveDiscard);
            }
            else if (cardIndex === 1) {
                forageDiscard = [...forageDiscard, card];
                [drawn, forageDeck, forageDiscard] = drawOne(forageDeck, forageDiscard);
            }
            else {
                skillDiscard = [...skillDiscard, card];
                [drawn, skillDeck, skillDiscard] = drawOne(skillDeck, skillDiscard);
            }
            const newHand = [...prev.hand];
            if (drawn) {
                newHand[cardIndex] = drawn;
            }
            else {
                newHand.splice(cardIndex, 1);
            }
            return { hand: newHand, moveDeck, moveDiscard, forageDeck, forageDiscard, skillDeck, skillDiscard };
        });
        setSelectedCard(null);
    }, []);
    const selectCard = useCallback((card) => {
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
