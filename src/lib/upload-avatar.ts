import { auth } from '@/lib/firebase';

export type UploadAvatarResult = { ok: true; url: string; path: string; bucket: string };

export async function uploadAvatarViaApi(file: File): Promise<UploadAvatarResult> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const token = await user.getIdToken();

  const form = new FormData();
  form.append('file', file, 'profile.png');

  const res = await fetch('/api/upload-avatar', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Upload failed (${res.status})`);
  }

  return (await res.json()) as UploadAvatarResult;
}
