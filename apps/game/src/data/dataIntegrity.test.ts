import { describe, expect, it } from 'vitest';
import { ITEMS } from './items';
import { RECIPES } from './recipes';
import { WORLD_EVENTS } from './events';
import { MINI_GAMES } from './minigames';
import { buildDeck } from './actionCards';

describe('data integrity', () => {
  it('has valid item ids and item numbers', () => {
    const ids = new Set<string>();
    const itemNumbers = new Set<number>();

    for (const item of ITEMS) {
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      expect(typeof item.itemNo).toBe('number');
      expect(item.itemNo).toBeGreaterThan(0);

      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);

      expect(itemNumbers.has(item.itemNo as number)).toBe(false);
      itemNumbers.add(item.itemNo as number);
    }

    expect(itemNumbers.size).toBe(ITEMS.length);
    expect(Math.min(...[...itemNumbers])).toBe(1);
    expect(Math.max(...[...itemNumbers])).toBe(ITEMS.length);
  });

  it('has unique ids in mini-game and world-event lists', () => {
    const gameIds = new Set(MINI_GAMES.map((game) => game.id));
    const eventIds = new Set<string>();

    for (const worldEvent of WORLD_EVENTS) {
      expect(worldEvent.id).toBeTypeOf('string');
      expect(worldEvent.id.length).toBeGreaterThan(0);
      expect(worldEvent.name).toBeTypeOf('string');
      expect(worldEvent.name.length).toBeGreaterThan(0);
      expect(worldEvent.description).toBeTypeOf('string');
      expect(worldEvent.description.length).toBeGreaterThan(0);
      expect(worldEvent.effect).toBeTypeOf('string');
      expect(worldEvent.effect.length).toBeGreaterThan(0);
      expect(eventIds.has(worldEvent.id)).toBe(false);
      eventIds.add(worldEvent.id);
    }

    expect(gameIds.size).toBe(MINI_GAMES.length);
    expect(eventIds.size).toBe(WORLD_EVENTS.length);
  });

  it('has valid action card definitions', () => {
    const deck = buildDeck();
    const cardIds = new Set<string>();
    const typeCounts = new Map<string, number>();
    const validRarities = [1, 2, 3, 4, 5];

    for (const card of deck) {
      expect(card.id).toMatch(/^card_\d+$/);
      expect(card.id.length).toBeGreaterThan(5);

      expect(typeof card.name).toBe('string');
      expect(card.name.length).toBeGreaterThan(0);
      expect(typeof card.description).toBe('string');
      expect(card.description.length).toBeGreaterThan(0);
      expect(typeof card.emoji).toBe('string');
      expect(card.emoji.length).toBeGreaterThan(0);
      expect(validRarities.includes(card.rarity)).toBe(true);

      if (card.moveRange !== undefined) {
        expect(card.moveRange).toBeTypeOf('number');
        expect(card.moveRange).toBeGreaterThanOrEqual(1);
      }

      expect(cardIds.has(card.id)).toBe(false);
      cardIds.add(card.id);

      const typeCount = typeCounts.get(card.type) ?? 0;
      typeCounts.set(card.type, typeCount + 1);
    }

    expect(cardIds.size).toBe(deck.length);
    expect(deck.length).toBeGreaterThan(0);
    expect(typeCounts.size).toBeGreaterThan(0);
  });

  it('uses only valid item ids in recipes', () => {
    const itemIds = new Set(ITEMS.map((item) => item.id));
    const recipeIds = new Set<string>();

    const unknownIngredientIds = new Set<string>();
    const unknownResultIds = new Set<string>();
    const missingRecipeQty = new Set<string>();

    for (const recipe of RECIPES) {
      expect(recipe.id).toBeTypeOf('string');
      expect(recipe.id.length).toBeGreaterThan(0);
      expect(recipe.name).toBeTypeOf('string');
      expect(recipe.name.length).toBeGreaterThan(0);
      expect(recipeIds.has(recipe.id)).toBe(false);
      recipeIds.add(recipe.id);

      for (const ingredient of recipe.ingredients) {
        expect(ingredient.itemId).toBeTypeOf('string');
        expect(ingredient.itemId.length).toBeGreaterThan(0);
        expect(typeof ingredient.quantity).toBe('number');
        expect(ingredient.quantity).toBeGreaterThan(0);
        if (!itemIds.has(ingredient.itemId)) {
          unknownIngredientIds.add(ingredient.itemId);
        }
      }

      expect(recipe.result.itemId).toBeTypeOf('string');
      expect(recipe.result.itemId.length).toBeGreaterThan(0);
      expect(typeof recipe.result.quantity).toBe('number');
      expect(recipe.result.quantity).toBeGreaterThan(0);
      if (!itemIds.has(recipe.result.itemId)) {
        unknownResultIds.add(recipe.result.itemId);
      }

      if (!recipe.result.itemId || recipe.result.quantity <= 0) {
        missingRecipeQty.add(recipe.id);
      }
    }

    expect(recipeIds.size).toBe(RECIPES.length);
    expect(unknownIngredientIds.size).toBe(0);
    expect(unknownResultIds.size).toBe(0);
    expect(missingRecipeQty.size).toBe(0);
  });
});
