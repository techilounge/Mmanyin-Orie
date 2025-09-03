// src/lib/firebase-admin.ts
import { getApps, initializeApp, getApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

function readFirebaseConfig() {
  try {
    return JSON.parse(process.env.FIREBASE_CONFIG || '{}') as {
      projectId?: string;
      storageBucket?: string;
    };
  } catch {
    return {};
  }
}

const cfg = readFirebaseConfig();

function resolveProjectId() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    cfg.projectId ||
    process.env.FIREBASE_PROJECT_ID
  );
}

function resolveStorageBucket() {
  // Prefer explicit env, else fall back to FIREBASE_CONFIG
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    cfg.storageBucket
  );
}

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: applicationDefault(),
        projectId: resolveProjectId(),
        storageBucket: resolveStorageBucket(), // e.g. "mmanyin-orie.firebasestorage.app"
      });

export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);