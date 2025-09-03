
'use client';

import { auth, db } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  UserCredential,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';

export async function signInWithGoogle(loginHint?: string): Promise<UserCredential | null> {
  await setPersistence(auth, browserLocalPersistence);
  
  const provider = new GoogleAuthProvider();
  const customParameters: { prompt: string; login_hint?: string } = { 
    prompt: 'select_account',
  };

  if (loginHint) {
    customParameters.login_hint = loginHint;
  }
  
  provider.setCustomParameters(customParameters);

  try {
    const cred = await signInWithPopup(auth, provider);
    return cred;
  } catch (e: any) {
    if (e.code === 'auth/popup-closed-by-user') {
      return null;
    }
    // For other errors, re-throw them to be caught by the caller.
    throw e;
  }
}

export async function ensureUserDocument(user: FirebaseUser, extraData?: Partial<AppUser>) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const newUser: Omit<AppUser, 'uid' | 'createdAt' | 'lastLoginAt'> = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      memberships: [],
      ...extraData,
    };
    await setDoc(ref, {
        ...newUser,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
    });
  } else {
    const updateData = { 
        lastLoginAt: serverTimestamp(),
        ...extraData
    };
    await updateDoc(ref, updateData);
  }
}
