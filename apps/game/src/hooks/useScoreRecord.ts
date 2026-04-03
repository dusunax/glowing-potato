import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from '../features/dont-say-it/lib/firebase';
import type { GameRecord } from '../types/score';

export function useScoreRecord() {
  const [saving, setSaving] = useState(false);

  const saveRecord = useCallback(async (record: Omit<GameRecord, 'id' | 'createdAt'>): Promise<string | null> => {
    const db = getFirestoreDb();
    if (!db) return null;
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'gameRecords'), {
        ...record,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return { saveRecord, saving };
}
