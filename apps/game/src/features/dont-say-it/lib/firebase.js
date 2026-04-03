import { getApps, getApp, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
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
    return Boolean(config.apiKey &&
        config.authDomain &&
        config.databaseURL &&
        config.appId);
}
function hasFirestoreConfigValues() {
    return Boolean(config.apiKey &&
        config.authDomain &&
        config.projectId &&
        config.appId);
}
let auth = null;
let database = null;
let firestoreDb = null;
export function getFirebaseAuth() {
    if (!config.apiKey || !config.authDomain)
        return null;
    if (!auth) {
        if (getApps().length === 0) {
            const app = initializeApp(config);
            auth = getAuth(app);
        }
        else {
            auth = getAuth(getApp());
        }
    }
    return auth;
}
export function getRealtimeDb() {
    if (!hasRealtimeDbConfigValues())
        return null;
    if (!database) {
        if (getApps().length === 0) {
            const app = initializeApp(config);
            database = getDatabase(app);
        }
        else {
            database = getDatabase(getApp());
        }
    }
    return database;
}
export function getFirestoreDb() {
    if (!hasFirestoreConfigValues())
        return null;
    if (!firestoreDb) {
        if (getApps().length === 0) {
            const app = initializeApp(config);
            firestoreDb = getFirestore(app);
        }
        else {
            firestoreDb = getFirestore(getApp());
        }
    }
    return firestoreDb;
}
export function hasAuthConfig() {
    return Boolean(config.apiKey && config.authDomain);
}
export function hasRealtimeDbConfig() {
    return hasRealtimeDbConfigValues();
}
export function hasFirestoreConfig() {
    return hasFirestoreConfigValues();
}
