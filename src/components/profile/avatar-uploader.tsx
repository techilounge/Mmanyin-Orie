'use client'

import { useEffect, useRef, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { uploadAvatarDirect } from '@/lib/upload-avatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { Loader2, Upload, Trash2 } from 'lucide-react'


function initialsFromName(name?: string | null) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts.at(-1)?.[0] ?? '' : ''
  return (first + last).toUpperCase() || 'U'
}

export function AvatarUploader() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  // local preview URL (blob:) or the final Storage URL
  const [localUrl, setLocalUrl] = useState<string | null>(null)

  // when true, we show the initials fallback instead of the <img>
  const [imgError, setImgError] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentPhoto = localUrl ?? user?.photoURL ?? null
  const initials = initialsFromName(user?.displayName)

  // reset image error whenever the src changes
  useEffect(() => {
    setImgError(false)
  }, [currentPhoto])

  const onPickFile = () => fileInputRef.current?.click()

  const onFileChosen: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // instant local preview
    const preview = URL.createObjectURL(file)
    setLocalUrl(preview)

    setIsSaving(true)
    try {
      // upload to Firebase Storage and get a download URL
      const result = await uploadAvatarDirect(file, user.uid)

      // cache-bust so the CDN shows the fresh image right away
      const busted = `${result.url}${result.url.includes('?') ? '&' : '?'}v=${Date.now()}`

      // 1) Firestore user doc
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: busted,
        photoPath: result.path,
        updatedAt: new Date(),
      })

      // 2) Firebase Auth profile (and force a reload so hooks see it)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: busted })
        await auth.currentUser.reload()
      }

      // 3) Swap preview to the real URL
      setLocalUrl(busted)
      toast({ title: 'Avatar updated ✅' })
    } catch (err: any) {
      console.error('Avatar upload failed:', err)
      toast({
        title: 'Upload failed',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      })
      // rollback preview
      setLocalUrl(null)
    } finally {
      setIsSaving(false)
      // cleanup preview blob
      setTimeout(() => URL.revokeObjectURL(preview), 5000)
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
        await auth.currentUser.reload()
      }
      setLocalUrl(null)
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

        {/* Avatar circle with robust fallback */}
        <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {currentPhoto && !imgError ? (
            <img
                src={currentPhoto}
                alt=""               // don’t show alt text if it fails
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setImgError(true)}
                loading="lazy"
            />
            ) : (
            <div className="text-xl font-semibold select-none">{initials}</div>
            )}
        </div>

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
