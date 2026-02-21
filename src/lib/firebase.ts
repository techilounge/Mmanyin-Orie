// Client-side Firebase initialization (NO Admin SDK here)
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

/**
 * Resolve Firebase client config.
 * 1. Prefer explicit NEXT_PUBLIC_* env vars (available locally and when configured as secrets).
 * 2. Fall back to FIREBASE_WEBAPP_CONFIG (auto-injected by Firebase App Hosting at build time).
 */
function getFirebaseConfig() {
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    }
  }

  // Firebase App Hosting injects this at build time
  if (process.env.FIREBASE_WEBAPP_CONFIG) {
    try {
      return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG)
    } catch {
      // fall through
    }
  }

  // Return a placeholder – Firebase calls will fail but the build won't crash
  return { apiKey: 'placeholder', projectId: 'placeholder' }
}

const firebaseConfig = getFirebaseConfig()

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
