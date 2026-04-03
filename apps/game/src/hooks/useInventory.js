// Hook managing the player's inventory.
// Exposes add, remove, getQuantity, and the inventory array.
import { useState, useCallback } from 'react';
export function useInventory() {
    const [inventory, setInventory] = useState([]);
    const addItem = useCallback((itemId, qty = 1) => {
        setInventory((prev) => {
            const existing = prev.find((s) => s.itemId === itemId);
            if (existing) {
                return prev.map((s) => s.itemId === itemId ? { ...s, quantity: s.quantity + qty } : s);
            }
            return [...prev, { itemId, quantity: qty }];
        });
    }, []);
    const removeItem = useCallback((itemId, qty = 1) => {
        let success = false;
        setInventory((prev) => {
            const slot = prev.find((s) => s.itemId === itemId);
            if (!slot || slot.quantity < qty)
                return prev;
            success = true;
            const next = prev
                .map((s) => (s.itemId === itemId ? { ...s, quantity: s.quantity - qty } : s))
                .filter((s) => s.quantity > 0);
            return next;
        });
        return success;
    }, []);
    const getQuantity = useCallback((itemId) => inventory.find((s) => s.itemId === itemId)?.quantity ?? 0, [inventory]);
    return { inventory, addItem, removeItem, getQuantity };
}
