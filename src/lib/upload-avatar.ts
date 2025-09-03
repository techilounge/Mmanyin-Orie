'use client';

import { getAuth } from 'firebase/auth';

export type UploadAvatarResult = {
  ok: true;
  url: string;
  path: string;
  bucket: string;
};

export async function uploadAvatarViaApi(file: File): Promise<UploadAvatarResult> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in');

  const idToken = await user.getIdToken();

  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/upload-avatar', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({} as any));
    throw new Error(data?.error || `Upload failed (${res.status})`);
  }

  return (await res.json()) as UploadAvatarResult;
}
