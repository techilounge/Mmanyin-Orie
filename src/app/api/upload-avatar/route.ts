/* Upload avatar server route (works in Firebase Studio and production) */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Require Firebase ID token from client
    const authz = req.headers.get('authorization') || '';
    const match = authz.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const idToken = match[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = (file.type?.split('/')[1] || 'png').toLowerCase();
    const objectPath = `avatars/${uid}/profile.${ext}`;

    const bucket = adminStorage.bucket(); // uses storageBucket from admin initializer
    const gcsFile = bucket.file(objectPath);

    await gcsFile.save(buffer, {
      contentType: file.type || 'image/png',
      resumable: false,
      // No need to set public ACL; your Storage Rules already allow read.
    });

    // Public URL via Firebase Storage REST (works with your open read rules)
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      objectPath
    )}?alt=media`;

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (err: any) {
    console.error('upload-avatar error:', err);
    return NextResponse.json(
      { error: 'Upload failed', details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}