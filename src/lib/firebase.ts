// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * All values must exist at runtime (Next.js reads NEXT_PUBLIC_* on both
 * the server and the client). Your .env.local should contain:
 *
 * NEXT_PUBLIC_FIREBASE_API_KEY=...
 * NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mmanyin-orie.firebaseapp.com
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID=mmanyin-orie
 * NEXT_PUBLIC_FIREBASE_APP_ID=...
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=682483710818
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mmanyin-orie.firebasestorage.app   <-- no https://, no gs://
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!, // e.g. "mmanyin-orie.firebasestorage.app"
};

// Avoid double-init in Next.js
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Pass gs:// URL so we *always* talk to the intended bucket (works for .app or .appspot buckets)
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

