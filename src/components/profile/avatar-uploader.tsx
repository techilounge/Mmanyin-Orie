'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { uploadAvatarViaApi, removeAvatar } from '@/lib/upload-avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

export default function AvatarUploader() {
  const user = useAuthUser();
  const { toast } = useToast();

  const uid = user?.uid ?? '';
  const initials = useMemo(
    () => initialsFromName(user?.displayName || user?.email),
    [user?.displayName, user?.email]
  );

  // Remote value from Firestore (truth source)
  const [serverUrl, setServerUrl] = useState<string | null>(null);

  // Fallback to initials if the image cannot render
  const [imgError, setImgError] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Live subscribe to users/{uid}.photoURL
  useEffect(() => {
    if (!uid) {
      setServerUrl(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      const url = (snap.data()?.photoURL as string | null) ?? null;
      setServerUrl(url);
    });
    return () => unsub();
  }, [uid]);

  // Reset the error whenever the displayed src changes
  const displaySrc = serverUrl ?? user?.photoURL ?? null;
  useEffect(() => {
    setImgError(false);
  }, [displaySrc]);

  const pickFile = () => fileRef.current?.click();

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    setIsSaving(true);
    try {
      // Upload the file to Storage and get the download URL
      const result = await uploadAvatarViaApi(file);
      
      // Update Firestore
      await updateDoc(doc(db, 'users', uid), {
        photoURL: result.url,
        photoPath: result.path,
        updatedAt: new Date(),
      });

      // reload user to get the new photoURL from the custom claims.
      await auth.currentUser?.reload();

      toast({ title: 'Avatar updated ✅' });
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      toast({
        title: 'Upload failed',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      await removeAvatar();
      await updateDoc(doc(db, 'users', uid), {
        photoURL: null,
        photoPath: null,
        updatedAt: new Date(),
      });
      await auth.currentUser?.reload();
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
    <div className="flex flex-col items-center gap-6">
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
          />
        ) : (
          <div className="text-xl font-semibold select-none">{initials}</div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={pickFile} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Change Photo'}
        </Button>
        <Button variant="destructive" onClick={handleRemove} disabled={isSaving}>
          Remove
        </Button>
      </div>
    </div>
  );
}
