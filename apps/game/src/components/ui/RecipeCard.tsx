// Displays a recipe with its ingredients, result, and a craft button.

import { ITEMS } from '../../data/items';
import type { Recipe } from '../../types/recipes';
import { Button } from '@glowing-potato/ui';
import { getItemSpawnHint } from '../../utils/itemHint';

function ItemRowBadge({
  itemId,
  quantity,
  className = '',
  tooltip,
}: { itemId: string; quantity?: string; className?: string; tooltip?: string }) {
  const item = ITEMS.find((i) => i.id === itemId);
  if (!item) return null;

  const label = quantity ? `${item.name} ${quantity}` : item.name;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={tooltip}>
      <span>{item.emoji}</span>
      <span>{label}</span>
    </span>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  canCraft: boolean;
  onCraft: () => void;
  getQuantity: (itemId: string) => number;
}

export function RecipeCard({ recipe, canCraft, onCraft, getQuantity }: RecipeCardProps) {
  const resultItem = ITEMS.find((i) => i.id === recipe.result.itemId);

  return (
    <div className={`bg-gp-bg/30 border rounded-lg p-4 transition-colors ${canCraft ? 'border-gp-mint/40' : 'border-gp-accent/20'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-semibold text-gp-mint">{recipe.name}</div>
          {/* text-gp-mint/85 on near-dark bg: high contrast ✓ */}
          <div className="text-xs text-gp-mint/85">{recipe.description}</div>
        </div>
        {resultItem && (
          <span className="text-2xl" title={resultItem.name}>{resultItem.emoji}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
      {recipe.ingredients.map((ing) => {
          const ingredientItem = ITEMS.find((i) => i.id === ing.itemId);
          if (!ingredientItem) return null;
          const have = getQuantity(ing.itemId);
          const enough = have >= ing.quantity;
          const tooltip = getItemSpawnHint(ingredientItem);
          return (
            <span
              key={ing.itemId}
              className={`text-xs px-2 py-1 rounded-full border ${
                enough ? 'border-gp-mint/40 text-gp-mint' : 'border-red-600/40 text-red-300'
              }`}
              title={tooltip}
              aria-label={tooltip}
            >
              <ItemRowBadge
                itemId={ing.itemId}
                quantity={`${have}/${ing.quantity}`}
                tooltip={tooltip}
              />
            </span>
          );
        })}
      </div>
      <Button
        variant={canCraft ? 'primary' : 'ghost'}
        size="sm"
        onClick={onCraft}
        disabled={!canCraft}
        className="w-full justify-center"
      >
        {canCraft ? '✨ Craft' : 'Missing ingredients'}
      </Button>
    </div>
  );
}
