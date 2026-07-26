import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
// Firestore's reserved default database is literally named "(default)". Some
// projects (this one included) can only create a *named* database via the
// Console without billing, so the ID must be explicit rather than relying on
// getFirestore(app)'s implicit "(default)" lookup.
const firestoreDatabaseId = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || "(default)";
export const db = getFirestore(firebaseApp, firestoreDatabaseId);
export const storage = getStorage(firebaseApp);
export const rtdb = getDatabase(firebaseApp);

export const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

// Guard against reconnecting on every hot-reload / re-render in dev.
declare global {
  var __chatlyEmulatorsConnected: boolean | undefined;
}

if (useEmulator && typeof window !== "undefined" && !globalThis.__chatlyEmulatorsConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectDatabaseEmulator(rtdb, "127.0.0.1", 9000);
  globalThis.__chatlyEmulatorsConnected = true;
}
