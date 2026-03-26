import { useState, useCallback, useMemo } from 'react';
import type { InventoryItem, DiscoveryEntry, WorldConditions, Item } from '../types/game';
import { ITEMS } from '../data/items';
import { RECIPES } from '../data/recipes';

function conditionsMatch(item: Item, conditions: WorldConditions): boolean {
  const { season, weather, timeOfDay } = conditions;
  const { spawnCondition } = item;
  if (spawnCondition.seasons && !spawnCondition.seasons.includes(season)) return false;
  if (spawnCondition.weathers && !spawnCondition.weathers.includes(weather)) return false;
  if (spawnCondition.timeOfDay && !spawnCondition.timeOfDay.includes(timeOfDay)) return false;
  return true;
}

const RARITY_WEIGHT: Record<string, number> = {
  common: 0.7,
  uncommon: 0.45,
  rare: 0.2,
  legendary: 0.05,
};

export function useGameState() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [discoveries, setDiscoveries] = useState<DiscoveryEntry[]>([]);
  const [log, setLog] = useState<string[]>(['Welcome to Petal Grove! Explore and collect items.']);

  const addLog = useCallback((message: string) => {
    setLog(prev => [message, ...prev].slice(0, 20));
  }, []);

  const spawnableItems = useCallback((conditions: WorldConditions): Item[] => {
    return ITEMS.filter(item => {
      if (item.category === 'crafted') return false;
      return conditionsMatch(item, conditions);
    });
  }, []);

  const tryCollect = useCallback((conditions: WorldConditions) => {
    const candidates = spawnableItems(conditions);
    if (candidates.length === 0) {
      addLog('Nothing to collect right now...');
      return;
    }

    // Weighted random pick
    const weighted = candidates.filter(item =>
      Math.random() < RARITY_WEIGHT[item.rarity]
    );

    if (weighted.length === 0) {
      addLog('You searched but found nothing this time.');
      return;
    }

    const item = weighted[Math.floor(Math.random() * weighted.length)];

    setInventory(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { itemId: item.id, quantity: 1 }];
    });

    // Check for new discovery
    setDiscoveries(prev => {
      if (!prev.find(d => d.itemId === item.id)) {
        addLog(`✨ New discovery: ${item.emoji} ${item.name}!`);
        return [...prev, {
          id: `${item.id}-${Date.now()}`,
          itemId: item.id,
          discoveredAt: {
            season: conditions.season,
            weather: conditions.weather,
            timeOfDay: conditions.timeOfDay,
            dayCount: conditions.dayCount,
          },
          timestamp: Date.now(),
        }];
      } else {
        addLog(`Found ${item.emoji} ${item.name}!`);
        return prev;
      }
    });
  }, [spawnableItems, addLog]);

  const canCraft = useCallback((recipeId: string): boolean => {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    return recipe.inputs.every(input => {
      const inv = inventory.find(i => i.itemId === input.itemId);
      return inv && inv.quantity >= input.quantity;
    });
  }, [inventory]);

  const craft = useCallback((recipeId: string) => {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe || !canCraft(recipeId)) return;

    setInventory(prev => {
      let updated = [...prev];
      // Remove ingredients
      for (const input of recipe.inputs) {
        updated = updated.map(i =>
          i.itemId === input.itemId
            ? { ...i, quantity: i.quantity - input.quantity }
            : i
        ).filter(i => i.quantity > 0);
      }
      // Add output
      const existing = updated.find(i => i.itemId === recipe.output.itemId);
      if (existing) {
        return updated.map(i =>
          i.itemId === recipe.output.itemId
            ? { ...i, quantity: i.quantity + recipe.output.quantity }
            : i
        );
      }
      return [...updated, { itemId: recipe.output.itemId, quantity: recipe.output.quantity }];
    });

    addLog(`🔨 Crafted: ${recipe.emoji} ${recipe.name}!`);
  }, [canCraft, addLog]);

  const spawnCount = useCallback((conditions: WorldConditions) => {
    return spawnableItems(conditions).length;
  }, [spawnableItems]);

  const allItemsDiscovered = useMemo(() => discoveries.length, [discoveries]);

  return {
    inventory,
    discoveries,
    log,
    tryCollect,
    canCraft,
    craft,
    spawnCount,
    allItemsDiscovered,
  };
}
