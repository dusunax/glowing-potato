import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFirestoreDb } from '../features/dont-say-it/lib/firebase';
import type { GameRecord } from '../types/score';

type LeaderboardRecord = GameRecord & { displayName: string };

export function useLeaderboard(topN = 10) {
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const db = getFirestoreDb();
    if (!db) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'gameRecords'), orderBy('score', 'desc'), limit(topN));
      const snap = await getDocs(q);
      const baseRecords = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          createdAt: raw.createdAt?.toMillis?.() ?? Date.now(),
        } as GameRecord;
      });
      const userIds = [
        ...new Set(
          baseRecords
            .map((record) => record.userId)
            .filter((id): id is string => typeof id === 'string' && !id.startsWith('guest-')),
        ),
      ];
      const userNicknameById = new Map<string, string>();

      await Promise.all(
        userIds.map(async (id) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (!userDoc.exists()) return;
          const data = userDoc.data();
          const lastNickname = data?.lastNickname;
          if (typeof lastNickname === 'string' && lastNickname.trim().length > 0) {
            userNicknameById.set(id, lastNickname);
          }
        }),
      );

      const data: LeaderboardRecord[] = baseRecords.map((record) => ({
        ...record,
        displayName:
          typeof record.userId === 'string' && record.userId.startsWith('guest-')
          ? 'Guest'
          : userNicknameById.get(record.userId) || record.nickname || String(record.userId),
      }));
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
