/* Upload avatar server route (works in Firebase Studio and production) */
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, getApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

/** Keep this route on the Node.js runtime. */
export const runtime = 'nodejs';
export const maxDuration = 60;

function adminApp() {
  if (getApps().length) return getApp();
  return initializeApp({
    credential: applicationDefault(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // e.g. "mmanyin-orie.firebasestorage.app"
  });
}

export async function POST(req: NextRequest) {
  try {
    const app = adminApp();

    // ---- 1) AuthN: verify Firebase ID token from the client
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const decoded = await getAuth(app).verifyIdToken(idToken);
    const uid = decoded.uid;

    // ---- 2) Read multipart form data (expects the file under "file")
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ---- 3) Write to Cloud Storage
    const bucket = getStorage(app).bucket(); // uses NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    const objectPath = `avatars/${uid}/profile.png`; // single canonical path
    const gcsFile = bucket.file(objectPath);

    await gcsFile.save(buffer, {
      contentType: file.type || 'image/png',
      metadata: {
        cacheControl: 'public, max-age=3600',
      },
      resumable: false,
      validation: 'md5',
    });

    // Public fetch URL (your Storage rules already allow read to anyone)
    const publicUrl =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}` +
      `/o/${encodeURIComponent(objectPath)}?alt=media`;

    return NextResponse.json({
      ok: true,
      path: objectPath,
      url: publicUrl,
      bucket: bucket.name,
    });
  } catch (err: any) {
    console.error('upload-avatar error:', err);
    return NextResponse.json({ error: err?.message ?? 'Upload failed' }, { status: 500 });
  }
}
