// Displays all recipes and allows the player to craft items.

import type { Recipe } from '../../types/recipes';
import { RecipeCard } from '../ui/RecipeCard';
import { CardTitle } from '@glowing-potato/ui';

interface CraftingPanelProps {
  recipes: Recipe[];
  canCraft: (recipe: Recipe) => boolean;
  onCraft: (recipeId: string) => void;
  getQuantity: (itemId: string) => number;
}

export function CraftingPanel({ recipes, canCraft, onCraft, getQuantity }: CraftingPanelProps) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      <CardTitle className="mb-3">⚗️ Crafting</CardTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto min-h-0 max-h-[calc(100vh-16rem)]">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            canCraft={canCraft(recipe)}
            onCraft={() => onCraft(recipe.id)}
            getQuantity={getQuantity}
          />
        ))}
      </div>
    </div>
  );
}
