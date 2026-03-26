// Displays all recipes and allows the player to craft items.

import type { Recipe } from '../../types/recipes';
import { RecipeCard } from '../ui/RecipeCard';

interface CraftingPanelProps {
  recipes: Recipe[];
  canCraft: (recipe: Recipe) => boolean;
  onCraft: (recipeId: string) => void;
  getQuantity: (itemId: string) => number;
}

export function CraftingPanel({ recipes, canCraft, onCraft, getQuantity }: CraftingPanelProps) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold mb-3 text-slate-100">⚗️ Crafting</h2>
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
