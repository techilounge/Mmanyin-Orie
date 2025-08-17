
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "mmanyin-orie",
  "appId": "1:682483710818:web:2d83085f55f3aba238ca3b",
  "storageBucket": "mmanyin-orie.appspot.com",
  "apiKey": "AIzaSyBUbeZbtpCZczcoV5c6dzC-uruSvZ3myns",
  "authDomain": "mmanyin-orie.firebaseapp.com",
  "messagingSenderId": "682483710818"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
