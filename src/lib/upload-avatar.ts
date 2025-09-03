import { auth } from '@/lib/firebase';

export async function uploadAvatarViaApi(file: File) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const idToken = await user.getIdToken();
  const body = new FormData();
  body.append('file', file);

  const res = await fetch('/api/upload-avatar', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Upload failed (${res.status})`);
  }

  return (await res.json()) as { ok: true; url: string; path: string; bucket: string };
}
