'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read from env (client-safe NEXT_PUBLIC_ for browser code)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mmanyin-orie.firebasestorage.app'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Always pass the GCS URL to guarantee the right bucket
const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, storage };
