import { useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb, hasAuthConfig } from '../features/dont-say-it/lib/firebase';

export type NicknameUpdateResult = 'success' | 'taken' | 'error';

function resolveNickname(storedNickname: string | undefined, user: User): string {
  return storedNickname || user.displayName || '';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  // Start loading only if auth is configured; otherwise nothing to wait for.
  const [loading, setLoading] = useState(() => hasAuthConfig());

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const db = getFirestoreDb();
        if (db) {
          const ref = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setNickname(resolveNickname(snap.data().nickname, firebaseUser));
          } else {
            const initial = resolveNickname(undefined, firebaseUser);
            await setDoc(ref, { uid: firebaseUser.uid, nickname: initial });
            setNickname(initial);
          }
        } else {
          setNickname(resolveNickname(undefined, firebaseUser));
        }
      } else {
        setNickname('');
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  const updateNickname = useCallback(
    async (next: string): Promise<NicknameUpdateResult> => {
      if (!user) return 'error';
      const trimmed = next.trim();
      if (!trimmed) return 'error';

      const db = getFirestoreDb();
      if (db) {
        const q = query(collection(db, 'users'), where('nickname', '==', trimmed));
        const snap = await getDocs(q);
        const taken = !snap.empty && snap.docs.some((d) => d.id !== user.uid);
        if (taken) return 'taken';
        await setDoc(doc(db, 'users', user.uid), { uid: user.uid, nickname: trimmed }, { merge: true });
      }

      setNickname(trimmed);
      return 'success';
    },
    [user],
  );

  return { user, nickname, loading, signInWithGoogle, signOut, updateNickname };
}
