// src/app/api/upload-avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';          // ensure Node.js, not Edge
export const dynamic = 'force-dynamic';   // avoid static optimization

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    // --- Auth: verify Firebase ID token from Authorization header
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const { getAdminAuth, getAdminStorage } = await import('@/lib/firebase-admin');
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // --- Read file from multipart/form-data
    const ct = req.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing 'file' field" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || 'application/octet-stream';

    // --- Upload to Storage
    const storage = getAdminStorage();
    const bucket = storage.bucket(); // uses default bucket from FIREBASE_CONFIG
    const path = `avatars/${uid}/profile.png`;

    const token = crypto.randomUUID();

    await bucket.file(path).save(buffer, {
      resumable: false,
      contentType,
      metadata: {
        cacheControl: 'public, max-age=3600',
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      path
    )}?alt=media&token=${token}`;

    return NextResponse.json(
      { ok: true, url, path, bucket: bucket.name },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('Upload avatar failed:', err);
    const message =
      typeof err?.message === 'string' ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
