// src/lib/firebase-admin.ts
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth as _getAuth } from 'firebase-admin/auth';
import { getStorage as _getStorage } from 'firebase-admin/storage';

type Cfg = { projectId?: string; storageBucket?: string };

function readCfg(): Cfg {
  // App Hosting / Studio injects FIREBASE_CONFIG. Fall back to web config/env.
  try {
    if (process.env.FIREBASE_CONFIG) {
      return JSON.parse(process.env.FIREBASE_CONFIG);
    }
  } catch {}
  try {
    if (process.env.FIREBASE_WEBAPP_CONFIG) {
      return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    }
  } catch {}

  return {
    projectId:
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };
}

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const cfg = readCfg();
  const projectId =
    cfg.projectId ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'mmanyin-orie'; // safe fallback

  const storageBucket =
    cfg.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  // CRITICAL: set projectId so verifyIdToken expects the real project (not "monospace-1")
  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket,
  });
}

export function getAdminAuth() {
  return _getAuth(getAdminApp());
}

export function getAdminStorage() {
  return _getStorage(getAdminApp());
}
