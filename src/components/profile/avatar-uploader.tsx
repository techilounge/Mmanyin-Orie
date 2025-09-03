'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { uploadAvatarDirect } from '@/lib/upload-avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function useAuthUser(): User | null {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);
  return user;
}

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
      // ignore transient failures
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

export function AvatarUploader() {
  const user = useAuthUser();
  const { toast } = useToast();

  const uid = user?.uid ?? '';
  const initials = useMemo(
    () => initialsFromName(user?.displayName || user?.email),
    [user?.displayName, user?.email]
  );

  // Remote value from Firestore (truth source)
  const [serverUrl, setServerUrl] = useState<string | null>(null);

  // Sticky local preview (survives remounts)
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  // Controls fallback to initials if <img> errors
  const [imgError, setImgError] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Restore any in-flight preview for this user
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

  // Reset error whenever the displayed src changes
  const displaySrc = localUrl ?? serverUrl ?? user?.photoURL ?? null;
  useEffect(() => {
    setImgError(false);
  }, [displaySrc]);

  const pickFile = () => fileRef.current?.click();

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = async e => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    const preview = URL.createObjectURL(file);
    setLocalUrl(preview);
    sessionStorage.setItem(`avatarPreview:${uid}`, preview);

    setIsSaving(true);
    try {
      // Upload to Storage
      const result = await uploadAvatarDirect(file, uid);

      // Cache-bust the URL
      const urlBusted = `${result.url}${result.url.includes('?') ? '&' : '?'}v=${Date.now()}`;

      // Wait until CDN serves it
      await waitUntilReachable(urlBusted);

      // Update Firestore
      await updateDoc(doc(db, 'users', uid), {
        photoURL: urlBusted,
        photoPath: result.path,
        updatedAt: new Date(),
      });

      // Update Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: urlBusted });
        await auth.currentUser.reload();
      }

      // Keep showing the final URL
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
      setLocalUrl(null);
      sessionStorage.removeItem(`avatarPreview:${uid}`);
    } finally {
      setIsSaving(false);
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

        <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {displaySrc && !imgError ? (
            <img
              src={displaySrc}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
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