// Hook for crafting: checks if ingredients are available and performs crafts.

import { useCallback } from 'react';
import { RECIPES } from '../data/recipes';
import type { Recipe } from '../types/recipes';

interface UseCraftingOptions {
  getQuantity: (itemId: string) => number;
  removeItem: (itemId: string, qty?: number) => boolean;
  addItem: (itemId: string, qty?: number) => void;
  markDiscovered: (itemId: string) => void;
}

export function useCrafting({
  getQuantity,
  removeItem,
  addItem,
  markDiscovered,
}: UseCraftingOptions) {
  const canCraft = useCallback(
    (recipe: Recipe): boolean =>
      recipe.ingredients.every((ing) => getQuantity(ing.itemId) >= ing.quantity),
    [getQuantity]
  );

  const craft = useCallback(
    (recipeId: string): string => {
      const recipe = RECIPES.find((r) => r.id === recipeId);
      if (!recipe) return 'Unknown recipe.';
      if (!canCraft(recipe)) return `Not enough ingredients for ${recipe.name}.`;
      recipe.ingredients.forEach((ing) => removeItem(ing.itemId, ing.quantity));
      addItem(recipe.result.itemId, recipe.result.quantity);
      markDiscovered(recipe.result.itemId);
      return `✨ Crafted: ${recipe.name}!`;
    },
    [canCraft, removeItem, addItem, markDiscovered]
  );

  return { canCraft, craft, recipes: RECIPES };
}
