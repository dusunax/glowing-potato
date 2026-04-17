// Hook managing the player's inventory.
// Exposes add, remove, getQuantity, and the inventory array.

import { useState, useCallback } from 'react';
import type { Inventory } from '../types/inventory';
import type { ItemId } from '../types/items';

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory>([]);

  const addItem = useCallback((itemId: ItemId, qty = 1) => {
    setInventory((prev) => {
      const existing = prev.find((s) => s.itemId === itemId);
      if (existing) {
        return prev.map((s) =>
          s.itemId === itemId ? { ...s, quantity: s.quantity + qty } : s
        );
      }
      return [...prev, { itemId, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((itemId: ItemId, qty = 1): boolean => {
    if (qty <= 0) return false;

    const slot = inventory.find((s) => s.itemId === itemId);
    if (!slot || slot.quantity < qty) {
      return false;
    }

    setInventory((prev) =>
      prev
        .map((s) => (s.itemId === itemId ? { ...s, quantity: s.quantity - qty } : s))
        .filter((s) => s.quantity > 0),
    );
    return true;
  }, [inventory]);

  const getQuantity = useCallback(
    (itemId: ItemId) => inventory.find((s) => s.itemId === itemId)?.quantity ?? 0,
    [inventory]
  );

  return { inventory, addItem, removeItem, getQuantity };
}
