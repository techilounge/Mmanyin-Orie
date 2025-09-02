
'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Upload, Trash2 } from 'lucide-react';

export function AvatarUploader() {
  const { user, appUser } = useAuth();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select an image file.' });
        return;
      }
      // Check file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Please select an image smaller than 5MB.' });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!user || !avatarFile) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/profile.png`);
      
      // Upload the new file
      await uploadBytes(storageRef, avatarFile, { contentType: avatarFile.type });
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firebase Auth profile
      await updateProfile(user, { photoURL: downloadURL });

      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { photoURL: downloadURL });

      toast({
        title: 'Avatar Updated',
        description: 'Your new profile picture has been saved.',
      });
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      console.error('Avatar upload failed:', err);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err?.message ?? 'We could not upload your avatar.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
      if (!user) return;
      setIsUploading(true);
      try {
        const storageRef = ref(storage, `avatars/${user.uid}/profile.png`);
        
        // Attempt to delete from storage
        try {
            await deleteObject(storageRef);
        } catch (error: any) {
            // Ignore "object not found" errors, as the user might not have an avatar yet
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
        }
        
        // Update profile and document with null
        await updateProfile(user, { photoURL: null });

        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { photoURL: null });

        toast({ title: 'Avatar Removed', description: 'Your profile picture has been removed.' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove avatar.' });
      } finally {
          setIsUploading(false);
      }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };
  
  const currentAvatarSrc = avatarPreview || appUser?.photoURL;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>Change your profile picture.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <Avatar className="h-32 w-32">
          <AvatarImage src={currentAvatarSrc ?? ''} alt={user?.displayName ?? 'User avatar'} />
          <AvatarFallback className="text-4xl">
            <User className="h-16 w-16" />
          </AvatarFallback>
        </Avatar>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif"
          className="hidden"
        />

        <div className="flex gap-4">
             <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
             >
                <Upload className="mr-2 h-4 w-4" />
                {avatarFile ? 'Change Photo' : 'Choose Photo'}
            </Button>

            {appUser?.photoURL && (
                <Button 
                    variant="destructive"
                    onClick={handleRemoveAvatar}
                    disabled={isUploading}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                </Button>
            )}
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
