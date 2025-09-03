// src/lib/firebase-admin.ts
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth as _getAuth } from 'firebase-admin/auth';
import { getStorage as _getStorage } from 'firebase-admin/storage';

function getAdminApp() {
  if (getApps().length) return getApps()[0]!;
  // App Hosting provides the default service account automatically.
  // Also set the bucket from FIREBASE_CONFIG (App Hosting injects it).
  const firebaseConfig = process.env.FIREBASE_CONFIG
    ? JSON.parse(process.env.FIREBASE_CONFIG)
    : {};
  return initializeApp({
    credential: applicationDefault(),
    storageBucket: firebaseConfig.storageBucket,
  });
}

export function getAdminAuth() {
  return _getAuth(getAdminApp());
}

export function getAdminStorage() {
  return _getStorage(getAdminApp());
}
