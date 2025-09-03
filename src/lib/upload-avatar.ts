import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export type UploadAvatarResult = {
  ok: true
  url: string
  path: string
  bucket: string
}

export async function uploadAvatarDirect(file: File, uid: string): Promise<UploadAvatarResult> {
  const path = `avatars/${uid}/profile.png`
  const objectRef = ref(storage, path)

  // Upload the file
  await uploadBytes(objectRef, file, {
    contentType: file.type || 'image/png'
  })

  // Get a download URL for immediate preview
  const url = await getDownloadURL(objectRef)

  // Bucket is derived from config; we include it for completeness
  const bucket = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string) || ''

  return { ok: true, url, path, bucket }
}
