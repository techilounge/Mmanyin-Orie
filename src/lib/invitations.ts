
// src/lib/invitations.ts
import {
  collection, doc, getDocs, getDoc, query, where,
  orderBy, limit, serverTimestamp, setDoc, updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type InviteDoc = {
  communityId: string;
  email: string;
  status: InviteStatus;
  createdAt: any; // Firestore Timestamp
  expiresAt?: any; // Firestore Timestamp (optional)
  inviterUid?: string;
  inviterName?: string;
  communityName?: string;
  replacedBy?: string; // id of the new invite when revoked
  memberId: string; // The ID of the member document in the subcollection
  acceptedByUid?: string;
  acceptedAt?: any;
};


/**
 * Creates a NEW invite token for {communityId, email}, revoking any older
 * pending ones, and returns the new token + URL you should email.
 */
export async function createOrResendInvite(params: {
  communityId: string;
  memberId: string;
  email: string;
  inviterUid?: string;
  inviterName?: string;
  communityName?: string;
  // optional: in days; set to 0/undefined to not expire
  ttlDays?: number;
}) {
  const {
    communityId, email, inviterUid, inviterName,
    communityName, memberId, ttlDays = 14
  } = params;

  const origin = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  // 1) Revoke any existing PENDING invites for the same email + community
  const q = query(
    collection(db, 'invitations'),
    where('communityId', '==', communityId),
    where('email', '==', email),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const prev = await getDocs(q);
  const replacedIds: string[] = [];
  prev.forEach(d => replacedIds.push(d.id));

  // 2) Create a new invite
  const ref = doc(collection(db, 'invitations'));
  const token = ref.id;
  const expiresAt =
    ttlDays && ttlDays > 0
      ? new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)
      : undefined;

  const payload = {
    communityId,
    email: email.toLowerCase(),
    memberId, // Now correctly included
    status: 'pending' as InviteStatus,
    createdAt: serverTimestamp(),
    inviterUid,
    inviterName,
    communityName,
    ...(expiresAt ? { expiresAt: expiresAt as any } : {})
  };

  await setDoc(ref, payload);

  // 3) Mark older pending invites as revoked and link them to the fresh token
  await Promise.all(
    replacedIds.map(async (id) => {
      await updateDoc(doc(db, 'invitations', id), {
        status: 'revoked',
        replacedBy: token
      });
    })
  );

  const url = `${origin}/auth/accept-invite?token=${token}`;
  return { token, url };
}

/** Optional helper: after a successful join, mark invite accepted */
export async function markInviteAccepted(token: string) {
  const inviteRef = doc(db, 'invitations', token);
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) return;
  if (snap.data().status !== 'pending') return;
  await updateDoc(inviteRef, { 
    status: 'accepted',
    acceptedAt: serverTimestamp()
  });
}
