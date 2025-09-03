// src/lib/firebase-admin.ts
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth as _getAuth } from 'firebase-admin/auth';
import { getStorage as _getStorage } from 'firebase-admin/storage';

type FbCfg = { projectId?: string; storageBucket?: string };

function readFirebaseConfig(): FbCfg {
  // App Hosting / Studio injects FIREBASE_CONFIG, and we also fall back to
  // FIREBASE_WEBAPP_CONFIG or env vars while developing locally.
  try {
    if (process.env.FIREBASE_CONFIG) return JSON.parse(process.env.FIREBASE_CONFIG);
  } catch {}
  try {
    if (process.env.FIREBASE_WEBAPP_CONFIG)
      return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
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

  const cfg = readFirebaseConfig();

  // CRITICAL: Set projectId so verifyIdToken expects the correct "aud"
  return initializeApp({
    credential: applicationDefault(),
    projectId: cfg.projectId,               // <- fixes "aud" mismatch
    storageBucket: cfg.storageBucket,
  });
}

export function getAdminAuth() {
  return _getAuth(getAdminApp());
}

export function getAdminStorage() {
  return _getStorage(getAdminApp());
}
