// Hook for crafting: checks if ingredients are available and performs crafts.
import { useCallback } from 'react';
import { RECIPES } from '../data/recipes';
export function useCrafting({ getQuantity, removeItem, addItem, markDiscovered, }) {
    const canCraft = useCallback((recipe) => recipe.ingredients.every((ing) => getQuantity(ing.itemId) >= ing.quantity), [getQuantity]);
    const craft = useCallback((recipeId) => {
        const recipe = RECIPES.find((r) => r.id === recipeId);
        if (!recipe)
            return 'Unknown recipe.';
        if (!canCraft(recipe))
            return `Not enough ingredients for ${recipe.name}.`;
        recipe.ingredients.forEach((ing) => removeItem(ing.itemId, ing.quantity));
        addItem(recipe.result.itemId, recipe.result.quantity);
        markDiscovered(recipe.result.itemId);
        return `✨ Crafted: ${recipe.name}!`;
    }, [canCraft, removeItem, addItem, markDiscovered]);
    return { canCraft, craft, recipes: RECIPES };
}
