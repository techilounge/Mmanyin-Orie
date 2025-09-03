/* Upload avatar on the server with Admin SDK */
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

export const runtime = 'nodejs';

function getAdmin() {
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      // This matches your bucket (screenshots show `.firebasestorage.app`)
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'mmanyin-orie.firebasestorage.app',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    getAdmin();

    // Require Firebase ID token
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization: Bearer <idToken>' }, { status: 401 });
    }
    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    // Expect multipart/form-data with a "file" field
    const ct = req.headers.get('content-type') || '';
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file') as unknown as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET || undefined);
    const objectPath = `avatars/${uid}/profile.png`;

    await bucket.file(objectPath).save(buffer, {
      contentType: file.type || 'image/png',
      resumable: false,
      metadata: { cacheControl: 'public,max-age=31536000,immutable' },
    });

    // Public read is allowed by your rules, so a simple Google Cloud Storage URL is fine
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(objectPath)}`;

    return NextResponse.json({ ok: true, url: publicUrl, path: objectPath, bucket: bucket.name });
  } catch (e: any) {
    console.error('upload-avatar error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
