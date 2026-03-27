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
    <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4 flex flex-col h-full">
      <CardTitle className="mb-3">⚗️ Crafting</CardTitle>
      <div className="space-y-3 overflow-y-auto flex-1">
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
