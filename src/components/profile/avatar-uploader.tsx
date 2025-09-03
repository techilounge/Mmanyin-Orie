'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { uploadAvatarDirect } from '@/lib/upload-avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function initialsFromName(name?: string | null) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts.at(-1)?.[0] ?? '' : '';
  return (first + last).toUpperCase() || 'U';
}

async function waitUntilReachable(url: string, tries = 6, delayMs = 400) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (res.ok) return true;
    } catch {
      // ignore
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

export function AvatarUploader() {
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  const uid = user?.uid ?? '';
  const initials = useMemo(() => initialsFromName(user?.displayName || user?.email), [user?.displayName, user?.email]);

  // Remote value coming from Firestore (truth source for the app)
  const [serverUrl, setServerUrl] = useState<string | null>(null);

  // A sticky local preview that survives remounts while backend catches up
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  // When true, show the fallback initials instead of <img>
  const [imgError, setImgError] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Restore any in-flight preview for this user (survives route refresh)
  useEffect(() => {
    if (!uid) return;
    const cached = sessionStorage.getItem(`avatarPreview:${uid}`);
    if (cached) setLocalUrl(cached);
  }, [uid]);

  // Live subscribe to users/{uid}.photoURL
  useEffect(() => {
    if (!uid) {
      setServerUrl(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', uid), snap => {
      const url = (snap.data()?.photoURL as string | null) ?? null;
      setServerUrl(url);
    });
    return () => unsub();
  }, [uid]);

  // Whenever the displayed source changes, clear previous error flag
  const displaySrc = localUrl ?? serverUrl ?? user?.photoURL ?? null;
  useEffect(() => {
    setImgError(false);
  }, [displaySrc]);

  const pickFile = () => fileRef.current?.click();

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = async e => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    // Instant local preview
    const preview = URL.createObjectURL(file);
    setLocalUrl(preview);
    sessionStorage.setItem(`avatarPreview:${uid}`, preview);

    setIsSaving(true);
    try {
      // Upload to Storage
      const result = await uploadAvatarDirect(file, uid);

      // Bust caches so we always see the latest
      const urlBusted = `${result.url}${result.url.includes('?') ? '&' : '?'}v=${Date.now()}`;

      // Wait until CDN is ready to serve this URL
      await waitUntilReachable(urlBusted);

      // 1) Update Firestore profile
      await updateDoc(doc(db, 'users', uid), {
        photoURL: urlBusted,
        photoPath: result.path,
        updatedAt: new Date(),
      });

      // 2) Update Firebase Auth profile + reload
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: urlBusted });
        await auth.currentUser.reload();
      }

      // Switch preview to the final URL
      setLocalUrl(urlBusted);
      sessionStorage.setItem(`avatarPreview:${uid}`, urlBusted);

      toast({ title: 'Avatar updated ✅' });
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      toast({
        title: 'Upload failed',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      });
      // Roll back preview on error
      setLocalUrl(null);
      sessionStorage.removeItem(`avatarPreview:${uid}`);
    } finally {
      setIsSaving(false);
      // small delay to avoid flicker before revoking
      setTimeout(() => URL.revokeObjectURL(preview), 2000);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        photoURL: null,
        photoPath: null,
        updatedAt: new Date(),
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: null });
        await auth.currentUser.reload();
      }
      setLocalUrl(null);
      sessionStorage.removeItem(`avatarPreview:${uid}`);
      toast({ title: 'Avatar removed' });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Could not remove avatar',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>Change your profile picture.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        {/* Avatar circle with robust fallback */}
        <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {displaySrc && !imgError ? (
            <img
              src={displaySrc}
              alt=""                   // never show textual “Avatar” fallback
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
              // these avoid old responses
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-xl font-semibold select-none">{initials}</div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={pickFile} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Change Photo'}
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={isSaving}>
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
