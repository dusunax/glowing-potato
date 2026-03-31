import { getApps, getApp, initializeApp } from 'firebase/app';
import type { Database } from 'firebase/database';
import { getDatabase } from 'firebase/database';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasRealtimeDbConfigValues() {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.databaseURL &&
      config.appId,
  );
}

function hasFirestoreConfigValues() {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.appId,
  );
}

let database: Database | null = null;
let firestoreDb: Firestore | null = null;

export function getRealtimeDb(): Database | null {
  if (!hasRealtimeDbConfigValues()) return null;
  if (!database) {
    if (getApps().length === 0) {
      const app = initializeApp(config);
      database = getDatabase(app);
    } else {
      database = getDatabase(getApp());
    }
  }
  return database;
}

export function getFirestoreDb(): Firestore | null {
  if (!hasFirestoreConfigValues()) return null;
  if (!firestoreDb) {
    if (getApps().length === 0) {
      const app = initializeApp(config);
      firestoreDb = getFirestore(app);
    } else {
      firestoreDb = getFirestore(getApp());
    }
  }
  return firestoreDb;
}

export function hasRealtimeDbConfig(): boolean {
  return hasRealtimeDbConfigValues();
}

export function hasFirestoreConfig(): boolean {
  return hasFirestoreConfigValues();
}
