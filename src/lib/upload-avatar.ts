// src/lib/upload-avatar.ts
'use client';

import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

export type UploadAvatarResult = {
  ok: true;
  url: string;
  path: string;
  bucket: string;
};

// Where each user is allowed to write by your Storage rules.
function avatarPathFor(uid: string) {
  return `avatars/${uid}/profile.png`;
}

/**
 * Minimal, reliable avatar upload:
 * - uploads directly with the Web SDK (no Admin SDK, no server route)
 * - returns a public download URL via getDownloadURL
 * - also updates Firebase Auth photoURL (best-effort)
 */
export async function uploadAvatarViaApi(file: File): Promise<UploadAvatarResult> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in');

  const path = avatarPathFor(user.uid);
  const objectRef = ref(storage, path);

  await uploadBytes(objectRef, file, {
    contentType: file.type || 'image/png',
    cacheControl: 'public,max-age=3600',
  });

  const url = await getDownloadURL(objectRef);

  // Keep Auth profile photo in sync (optional, best-effort)
  try {
    await updateProfile(user, { photoURL: url });
  } catch {
    // ignore — not critical for upload success
  }

  return {
    ok: true,
    url,
    path,
    bucket: (storage.app.options as any).storageBucket as string,
  };
}

/**
 * Optional helper: remove the avatar object & clear Auth photoURL.
 */
export async function removeAvatar(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in');

  const path = avatarPathFor(user.uid);
  await deleteObject(ref(storage, path)).catch(() => { /* ignore if not found */ });
  try {
    await updateProfile(user, { photoURL: '' });
  } catch {
    // non-fatal
  }
}
