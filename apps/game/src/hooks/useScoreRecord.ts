import { useState, useCallback } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from '../features/dont-say-it/lib/firebase';
import type { AnimalRecord, GameRecord } from '../types/score';

const GAME_HISTORY_COLLECTION = 'game_histories';
const LEADERBOARD_BUCKET = 'records';

function resolveGameHistoryCollection(gameId?: string) {
  if (gameId === 'dont-say-it') return 'dont_say_it';
  if (gameId === 'glowing_potato') return 'glowing_potato';
  return 'glowing_potato';
}

function sanitizeGameRecord(record: Omit<GameRecord, 'id' | 'createdAt'>) {
  const toNumber = (value: unknown, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const normalizeRarity = (value: unknown): AnimalRecord['rarity'] => {
    if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) {
      return value;
    }
    return 1;
  };

  return {
    userId: String(record.userId || ''),
    gameId: String(record.gameId || 'collection'),
    nickname: String((record as { nickname?: string }).nickname || 'Guest'),
    score: toNumber(record.score, 0),
    survivalDays: toNumber(record.survivalDays, 0),
    level: toNumber(record.level, 1),
    totalXpGained: toNumber(record.totalXpGained, 0),
    defeatedAnimals: Array.isArray(record.defeatedAnimals)
      ? record.defeatedAnimals.map((animal) => ({
          name: String(animal?.name || ''),
          emoji: String(animal?.emoji || ''),
          rarity: normalizeRarity((animal as { rarity?: unknown })?.rarity),
          count: Math.max(0, toNumber(animal?.count, 0)),
        }))
      : [],
    inventorySnapshot: Array.isArray(record.inventorySnapshot)
      ? record.inventorySnapshot.map((item) => ({
          itemId: String(item?.itemId || ''),
          quantity: Math.max(0, toNumber(item?.quantity, 0)),
        }))
      : [],
  };
}

export function useScoreRecord() {
  const [saving, setSaving] = useState(false);

  const saveRecord = useCallback(async (record: Omit<GameRecord, 'id' | 'createdAt'>): Promise<string | null> => {
    const db = getFirestoreDb();
    if (!db) return null;
    setSaving(true);
    try {
      const payload = sanitizeGameRecord(record);
      if (!payload.userId) {
        return null;
      }
      const leaderboardCollection = resolveGameHistoryCollection(payload.gameId);
      const bucket = collection(db, GAME_HISTORY_COLLECTION, leaderboardCollection, LEADERBOARD_BUCKET);
      const recordRef = await addDoc(bucket, {
        ...payload,
        createdAt: serverTimestamp(),
      });
      return recordRef.id;
    } catch (error) {
      console.error('Failed to save game record to game_histories', {
        code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : 'unknown',
        message: error instanceof Error ? error.message : String(error),
        record,
      });
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return { saveRecord, saving };
}
