
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "mmanyin-orie",
  appId: "1:682483710818:web:2d83085f55f3aba238ca3b",
  storageBucket: "mmanyin-orie.firebasestorage.app",
  apiKey: "AIzaSyBUbeZbtpCZczcoV5c6dzC-uruSvZ3myns",
  authDomain: "mmanyin-orie.firebaseapp.com",
  messagingSenderId: "682483710818",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
