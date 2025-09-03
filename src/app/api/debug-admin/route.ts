import { NextResponse } from 'next/server';
import { getAdminInfo } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getAdminInfo());
}
