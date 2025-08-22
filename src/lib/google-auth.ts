
'use client';

import { auth, db } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  UserCredential,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';


const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<UserCredential | null> {
  await setPersistence(auth, browserLocalPersistence);
  try {
    const cred = await signInWithPopup(auth, provider);
    return cred;
  } catch (e: any) {
    const code = e?.code ?? '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      code === 'auth/internal-error'
    ) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw e;
  }
}

/** Call on auth pages to complete redirect flows & create/update /users doc. */
export async function completeGoogleRedirect(): Promise<UserCredential | null> {
  await setPersistence(auth, browserLocalPersistence);
  const result = await getRedirectResult(auth).catch(() => null);
  if (result?.user) {
    await ensureUserDocument(result.user);
  }
  return result;
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
