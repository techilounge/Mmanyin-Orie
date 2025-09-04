// src/lib/invitations.ts
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  Firestore,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type FindArgs = {
  communityId: string;
  memberId?: string; // id in communities/{id}/members
  uid?: string;      // historical key in some installs
  email?: string;    // fallback
};

type CreateArgs = {
  communityId: string;
  memberId?: string;
  uid?: string;
  email: string;
  name?: string;
};

export function buildInviteUrl(token: string) {
  // works in Studio preview and prod
  const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://mmanyinorie.com');
  return `${base}/auth/accept-invite?token=${encodeURIComponent(token)}`;
}

async function tryFindLatestPending(
  store: Firestore,
  baseFilters: any[],
) {
  const q = query(
    collection(store, 'invitations'),
    ...baseFilters,
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(1),
  );

  const snap = await getDocs(q);
  return snap.docs[0] ?? null;
}

/**
 * Find a pending invite by memberId → uid → email (in that order).
 * If not found and autoCreate=true, a new invite is created and returned.
 */
export async function getOrCreateInviteLink(
  {
    communityId,
    memberId,
    uid,
    email,
  }: FindArgs & { email?: string },
  autoCreate = true,
) {
  // 1) try memberId
  if (memberId) {
    const d = await tryFindLatestPending(db, [
      where('communityId', '==', communityId),
      where('memberId', '==', memberId),
    ]);
    if (d) {
      const token = d.id;
      return { token, link: buildInviteUrl(token) };
    }
  }

  // 2) try uid (older schema)
  if (uid) {
    const d = await tryFindLatestPending(db, [
      where('communityId', '==', communityId),
      where('uid', '==', uid),
    ]);
    if (d) {
      const token = d.id;
      return { token, link: buildInviteUrl(token) };
    }
  }

  // 3) try email (fallback)
  if (email) {
    const d = await tryFindLatestPending(db, [
      where('communityId', '==', communityId),
      where('email', '==', email.toLowerCase()),
    ]);
    if (d) {
      const token = d.id;
      return { token, link: buildInviteUrl(token) };
    }
  }

  // None found
  if (!autoCreate) {
    throw new Error(
      'No pending invitation found for this member. Please create a new one if needed.',
    );
  }

  // Create a fresh invite
  const inviteRef = doc(collection(db, 'invitations')); // use doc id as token
  const token = inviteRef.id;

  await setDoc(inviteRef, {
    token,
    communityId,
    memberId: memberId || null,
    uid: uid || null,
    email: (email || '').toLowerCase(),
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return { token, link: buildInviteUrl(token) };
}
