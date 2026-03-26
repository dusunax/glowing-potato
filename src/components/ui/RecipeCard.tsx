// Displays a recipe with its ingredients, result, and a craft button.

import { ITEMS } from '../../data/items';
import type { Recipe } from '../../types/recipes';

interface RecipeCardProps {
  recipe: Recipe;
  canCraft: boolean;
  onCraft: () => void;
  getQuantity: (itemId: string) => number;
}

export function RecipeCard({ recipe, canCraft, onCraft, getQuantity }: RecipeCardProps) {
  const resultItem = ITEMS.find((i) => i.id === recipe.result.itemId);

  return (
    <div className={`bg-slate-800 border rounded-lg p-4 transition-colors ${canCraft ? 'border-emerald-600' : 'border-slate-700'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-semibold text-slate-100">{recipe.name}</div>
          <div className="text-xs text-slate-400">{recipe.description}</div>
        </div>
        {resultItem && (
          <span className="text-2xl" title={resultItem.name}>{resultItem.emoji}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {recipe.ingredients.map((ing) => {
          const item = ITEMS.find((i) => i.id === ing.itemId);
          const have = getQuantity(ing.itemId);
          const enough = have >= ing.quantity;
          return (
            <span
              key={ing.itemId}
              className={`text-xs px-2 py-1 rounded-full border ${enough ? 'border-emerald-600 text-emerald-300' : 'border-red-700 text-red-400'}`}
            >
              {item?.emoji} {item?.name} {have}/{ing.quantity}
            </span>
          );
        })}
      </div>
      <button
        onClick={onCraft}
        disabled={!canCraft}
        className={`w-full py-1.5 rounded text-sm font-semibold transition-colors ${
          canCraft
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
        }`}
      >
        {canCraft ? '✨ Craft' : 'Missing ingredients'}
      </button>
    </div>
  );
}
