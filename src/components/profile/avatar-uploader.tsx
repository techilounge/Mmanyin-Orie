
'use client';

import { useRef, useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';

import { Loader2, Upload, Trash2, User } from 'lucide-react';
import { uploadAvatarViaApi } from '@/lib/upload-avatar';

export function AvatarUploader() {
  const { user, appUser } = useAuth();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please pick an image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Too large', description: 'Max size is 5MB.' });
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!avatarFile || !user) return;

    setIsUploading(true);
    try {
      // 1) Upload via the new server route
      const { url } = await uploadAvatarViaApi(avatarFile);

      // 2) Update Firebase Auth profile
      await updateProfile(user, { photoURL: url });

      // 3) Update Firestore user doc
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: url,
        updatedAt: new Date(),
      });

      toast({ title: 'Avatar updated', description: 'Your profile photo has been saved.' });
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error?.message ?? 'We could not upload your avatar.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;

    setIsUploading(true);
    try {
      // For removal, we can just clear the URLs
      await updateProfile(user, { photoURL: null });
      await updateDoc(doc(db, 'users', user.uid), { photoURL: null });

      toast({ title: 'Avatar removed', description: 'Your profile photo has been removed.' });
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      console.error('Remove avatar failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: error?.message ?? 'Failed to remove avatar.' });
    } finally {
      setIsUploading(false);
    }
  };

  const currentAvatar = avatarPreview || appUser?.photoURL || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>Change your profile picture.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-6">
        <Avatar className="h-32 w-32">
          <AvatarImage src={currentAvatar} alt={user?.displayName ?? 'User avatar'} />
          <AvatarFallback className="text-4xl">
            <User className="h-16 w-16" />
          </AvatarFallback>
        </Avatar>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif"
          onChange={onChoose}
          className="hidden"
        />

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            {avatarFile ? 'Change Photo' : 'Choose Photo'}
          </Button>

          {appUser?.photoURL && (
            <Button variant="destructive" onClick={handleRemove} disabled={isUploading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleUpload} disabled={!avatarFile || isUploading}>
          {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}
