// src/app/api/upload-avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminStorage } from '@/lib/firebase-admin';

export const runtime = 'nodejs'; // ensure Node runtime (not edge)

// Accepts multipart/form-data with key "file" and Authorization: Bearer <idToken>
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing Authorization: Bearer <ID token>' }, { status: 401 });
    }
    const idToken = authHeader.slice('Bearer '.length);

    // Verifies against the correct project because projectId was set in firebase-admin.ts
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    const contentType = file.type || 'application/octet-stream';
    const ext = (contentType.split('/')[1] || 'png').toLowerCase();
    const path = `avatars/${decoded.uid}/profile.${ext}`;

    const storage = getAdminStorage();
    const bucket = storage.bucket(); // uses storageBucket from admin init
    const token = crypto.randomUUID();

    await bucket.file(path).save(bytes, {
      resumable: false,
      contentType,
      metadata: {
        cacheControl: 'public,max-age=3600',
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      path
    )}?alt=media&token=${token}`;

    return NextResponse.json({ ok: true, url, path, bucket: bucket.name });
  } catch (err: any) {
    // Surface auth/audience errors to the client for easier debugging
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}