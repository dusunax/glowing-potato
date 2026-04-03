// Displays all recipes and allows the player to craft items.
import { RecipeCard } from '../ui/RecipeCard';
import { CardTitle } from '@glowing-potato/ui';
export function CraftingPanel({ recipes, canCraft, onCraft, getQuantity }) {
    return (<div className="flex flex-col">
      <CardTitle className="mb-3">⚗️ Crafting</CardTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto">
        {recipes.map((recipe) => (<RecipeCard key={recipe.id} recipe={recipe} canCraft={canCraft(recipe)} onCraft={() => onCraft(recipe.id)} getQuantity={getQuantity}/>))}
      </div>
    </div>);
}
