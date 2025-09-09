// src/lib/firebase-admin.ts
import { getApps, initializeApp, applicationDefault, App } from 'firebase-admin/app';
import { getAuth as _getAuth } from 'firebase-admin/auth';
import { getStorage as _getStorage } from 'firebase-admin/storage';
import { getFirestore as _getFirestore } from 'firebase-admin/firestore';

function j<T = any>(s?: string | null): T | undefined { try { return s ? JSON.parse(s) : undefined; } catch { return undefined; } }
const isStudio = (id?: string) => !!id && /^monospace-/i.test(id || '');

function pickProjectId(): string {
  const fc = j<{ projectId?: string }>(process.env.FIREBASE_CONFIG);
  if (fc?.projectId && !isStudio(fc.projectId)) return fc.projectId;

  const web = j<{ projectId?: string }>(process.env.FIREBASE_WEBAPP_CONFIG);
  if (web?.projectId && !isStudio(web.projectId)) return web.projectId;

  const env = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (env && !isStudio(env)) return env;

  const gcp = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (gcp && !isStudio(gcp)) return gcp;

  return 'mmanyin-orie';
}

function pickBucket(): string | undefined {
  const fc = j<{ storageBucket?: string }>(process.env.FIREBASE_CONFIG);
  if (fc?.storageBucket) return fc.storageBucket;
  const web = j<{ storageBucket?: string }>(process.env.FIREBASE_WEBAPP_CONFIG);
  if (web?.storageBucket) return web.storageBucket;
  return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
}

function getAdminApp(): App {
  const app = getApps().find(a => a.name === 'admin');
  if (app) return app;
  
  return initializeApp({
    credential: applicationDefault(),
    projectId: pickProjectId(),
    storageBucket: pickBucket(),
  }, 'admin');
}

export function getAdminAuth()    { return _getAuth(getAdminApp()); }
export function getAdminStorage() { return _getStorage(getAdminApp()); }
export function getAdminFirestore() { return _getFirestore(getAdminApp()); }


// Small helper you can use for debugging
export function getAdminInfo() {
  const app = getAdminApp();
  // @ts-ignore - options is fine at runtime
  const { projectId, storageBucket } = app.options || {};
  return {
    projectId,
    storageBucket,
    db: getAdminFirestore(),
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    FIREBASE_CONFIG: j(process.env.FIREBASE_CONFIG),
    FIREBASE_WEBAPP_CONFIG: j(process.env.FIREBASE_WEBAPP_CONFIG),
  };
}
