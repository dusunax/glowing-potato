// Hook tracking which items the player has ever collected (discovery journal).
// Exposes discovered set and markDiscovered action.
import { useState, useCallback } from 'react';
export function useDiscovery() {
    const [discovered, setDiscovered] = useState(new Set());
    const markDiscovered = useCallback((itemId) => {
        setDiscovered((prev) => {
            if (prev.has(itemId))
                return prev;
            return new Set([...prev, itemId]);
        });
    }, []);
    const isDiscovered = useCallback((itemId) => discovered.has(itemId), [discovered]);
    return { discovered, markDiscovered, isDiscovered };
}
