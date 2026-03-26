// TypeScript interfaces for crafting recipes.
// To add recipe properties: extend the Recipe interface here.

import type { ItemId } from './items';

export interface RecipeIngredient {
  itemId: ItemId;
  quantity: number;
}

export interface RecipeResult {
  itemId: ItemId;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  result: RecipeResult;
}
