import { useCallback } from 'react';
import {
  type QueryDocumentSnapshot,
  collection,
  query,
  limit,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFirestoreDb } from '../features/dont-say-it/lib/firebase';
import type { GameRecord } from '../types/score';

const GAME_HISTORY_COLLECTION = 'game_histories';
const LEADERBOARD_BUCKET = 'records';

function resolveLeaderboardCollection(gameId?: string) {
  if (gameId === 'dont-say-it') return 'dont_say_it';
  if (gameId === 'glowing_potato') return 'glowing_potato';
  return 'glowing_potato';
}

type LeaderboardRecord = GameRecord & { displayName: string };

function toLeaderboardRecord(docSnap: QueryDocumentSnapshot): LeaderboardRecord & { id: string; createdAt: number } {
  const raw = docSnap.data();
  return {
    ...raw,
    id: docSnap.id,
    createdAt: typeof raw.createdAt?.toMillis === 'function' ? raw.createdAt.toMillis() : Date.now(),
  } as LeaderboardRecord & { id: string; createdAt: number };
}

export function useLeaderboard(topN = 10, gameId?: string) {
  const queryClient = useQueryClient();
  const normalizedGameId = gameId ?? '';
  const normalizedCollection = resolveLeaderboardCollection(normalizedGameId);
  const queryKey = ['leaderboard', topN, normalizedGameId] as const;

  const loadRecords = useCallback(async (): Promise<LeaderboardRecord[]> => {
    const db = getFirestoreDb();
    if (!db) return [];
    try {
      const recordsCollection = collection(db, GAME_HISTORY_COLLECTION, normalizedCollection, LEADERBOARD_BUCKET);
      const fetchQuery = query(recordsCollection, limit(Math.max(topN * 20, 200)));
      const snaps = await getDocs(fetchQuery);
      const unique = new Map<string, ReturnType<typeof toLeaderboardRecord>>();

      snaps.docs.forEach((docSnap) => {
        unique.set(docSnap.id, toLeaderboardRecord(docSnap as QueryDocumentSnapshot));
      });

      const baseRecords = [...unique.values()].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, topN);

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

      const data = baseRecords.map((record) => ({
        ...record,
        displayName:
          typeof record.userId === 'string' && record.userId.startsWith('guest-')
            ? 'Guest'
            : userNicknameById.get(record.userId) || record.nickname || String(record.userId),
      }));
      return data;
    } catch (error) {
      console.error('Failed to load leaderboard records', error);
      return [];
    }
  }, [normalizedGameId, topN]);

  const {
    data: records = [],
    isLoading: loading,
    refetch: refresh,
  } = useQuery({
    queryKey,
    queryFn: loadRecords,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { records, loading, refresh, invalidate };
}
