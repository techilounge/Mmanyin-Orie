'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Upload, Trash2 } from 'lucide-react';
import { uploadAvatarViaApi } from '@/lib/upload-avatar';

export function AvatarUploader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.photoURL || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!user || !avatarFile) return;

    try {
      setIsUploading(true);

      const { url } = await uploadAvatarViaApi(avatarFile);

      // Update Firebase Auth profile + Firestore doc
      await updateProfile(user, { photoURL: url }).catch(() => {});
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });

      setPreviewUrl(url);
      setAvatarFile(null);
      toast({ title: 'Avatar updated' });
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      toast({
        title: 'Upload failed',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      setIsUploading(true);
      await updateProfile(user, { photoURL: null }).catch(() => {});
      await updateDoc(doc(db, 'users', user.uid), { photoURL: null });
      setPreviewUrl(null);
      toast({ title: 'Avatar removed' });
    } catch (err: any) {
      toast({
        title: 'Failed to remove avatar',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>Change your profile picture.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl ?? undefined} alt="Profile" />
          <AvatarFallback>
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Change Photo
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      </CardContent>

      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleUpload} disabled={!avatarFile || isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
