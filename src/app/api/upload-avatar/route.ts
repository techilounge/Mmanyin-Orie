// src/app/api/upload-avatar/route.ts
export const runtime = 'nodejs';
export async function POST() {
  return new Response(JSON.stringify({ ok: false, error: 'Disabled. Upload from client.' }), {
    status: 405,
    headers: { 'content-type': 'application/json' },
  });
}
