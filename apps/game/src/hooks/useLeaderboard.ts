import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getFirestoreDb } from '../features/dont-say-it/lib/firebase';
import type { GameRecord } from '../types/score';

export function useLeaderboard(topN = 10) {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const db = getFirestoreDb();
    if (!db) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'gameRecords'), orderBy('score', 'desc'), limit(topN));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          createdAt: raw.createdAt?.toMillis?.() ?? Date.now(),
        } as GameRecord;
      });
      setRecords(data);
    } catch {
      // Firestore not available or index not ready
    } finally {
      setLoading(false);
    }
  }, [topN]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { records, loading, refresh };
}
