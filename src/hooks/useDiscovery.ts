// Hook tracking which items the player has ever collected (discovery journal).
// Exposes discovered set and markDiscovered action.

import { useState, useCallback } from 'react';
import type { ItemId } from '../types/items';

export function useDiscovery() {
  const [discovered, setDiscovered] = useState<Set<ItemId>>(new Set());

  const markDiscovered = useCallback((itemId: ItemId) => {
    setDiscovered((prev) => {
      if (prev.has(itemId)) return prev;
      return new Set([...prev, itemId]);
    });
  }, []);

  const isDiscovered = useCallback(
    (itemId: ItemId) => discovered.has(itemId),
    [discovered]
  );

  return { discovered, markDiscovered, isDiscovered };
}
