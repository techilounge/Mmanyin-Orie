'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { uploadAvatarDirect } from '@/lib/upload-avatar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'


function initialsFromName(name?: string | null) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase() || 'U'
}

export function AvatarUploader() {
  const { user } = useAuth();
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentPhoto = previewUrl || user?.photoURL || null

  const onPickFile = () => fileInputRef.current?.click()

  const onFileChosen: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Local preview first (works with <img src="blob:...">)
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    setIsSaving(true)
    try {
      const result = await uploadAvatarDirect(file, user.uid)

      // cache-bust the CDN url so it refreshes immediately
      const busted = `${result.url}${result.url.includes('?') ? '&' : '?'}v=${Date.now()}`

      // 1) update Firestore user doc
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: busted,
        photoPath: result.path,
        updatedAt: new Date(),
      })

      // 2) update Firebase Auth profile so the avatar persists across routes/reloads
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: busted })
      }

      // 3) swap the preview to the real URL
      setPreviewUrl(busted)

      toast({ title: 'Avatar updated ✅' })
    } catch (err: any) {
      console.error('Avatar upload failed:', err)
      toast({
        title: 'Upload failed',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      })
      // if upload failed, drop the temporary preview
      setPreviewUrl(null)
    } finally {
      // clean up the blob URL after a moment
      setTimeout(() => URL.revokeObjectURL(localPreview), 5000)
      setIsSaving(false)
      // reset the input so picking the same file again works
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: null,
        photoPath: null,
        updatedAt: new Date(),
      })
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: null })
      }
      setPreviewUrl(null)
      toast({ title: 'Avatar removed' })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Could not remove avatar',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>Change your profile picture.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChosen}
        />

        <Avatar className="h-24 w-24">
            {currentPhoto ? (
            <AvatarImage
                src={currentPhoto}
                alt="Avatar"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
            />
            ) : null}
            <AvatarFallback>{initialsFromName(user?.displayName)}</AvatarFallback>
        </Avatar>

        <div className="flex gap-3">
            <Button variant="outline" onClick={onPickFile} disabled={isSaving}>
                 <Upload className="mr-2 h-4 w-4" />
                {isSaving ? 'Uploading...' : 'Change Photo'}
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isSaving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}
