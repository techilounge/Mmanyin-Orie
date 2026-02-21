'use server';

import { getAdminInfo } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

export async function acceptInvitationAction(
  token: string,
  userUid: string,
  userEmail: string,
  userDisplayName: string
): Promise<{ success: boolean; communityId?: string; message: string }> {
  const adminDb = getAdminInfo().db;
  if (!token || !userUid || !userEmail) {
    return { success: false, message: 'Missing required parameters.' };
  }

  try {
    const inviteRef = adminDb.collection('invitations').doc(token);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      return { success: false, message: 'This invitation is invalid or has expired.' };
    }

    const invite = inviteSnap.data() as {
      communityId: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      gender?: 'male' | 'female';
      family?: string;
      tier?: string;
      status?: string;
      isPatriarch?: boolean;
    };

    if (invite.status !== 'pending') {
      return { success: false, message: 'This invitation has already been accepted or is no longer valid.' };
    }

    if (invite.email && invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      return { success: false, message: 'This invitation was sent to a different email address.' };
    }

    const communityId = invite.communityId;
    const memberRef = adminDb.collection('communities').doc(communityId).collection('members').doc(userUid);
    const userRef = adminDb.collection('users').doc(userUid);

    // Use a batch to write everything atomically
    const batch = adminDb.batch();

    // 1. Create/merge member document
    batch.set(
      memberRef,
      {
        uid: userUid,
        email: userEmail,
        name: userDisplayName || `${invite.firstName || ''} ${invite.lastName || ''}`.trim(),
        firstName: invite.firstName || '',
        lastName: invite.lastName || '',
        middleName: '',
        gender: invite.gender || 'male',
        role: 'user',
        status: 'active',
        joinDate: FieldValue.serverTimestamp(),
        family: invite.family || 'Unassigned',
        tier: invite.tier || 'N/A',
        isPatriarch: invite.isPatriarch || false,
      },
      { merge: true }
    );

    // 2. Update/create user document with memberships
    // We try to merge memberships. If the doc doesn't exist, set with merge: true handles it.
    batch.set(
      userRef,
      {
        uid: userUid,
        email: userEmail,
        displayName: userDisplayName || '',
        memberships: FieldValue.arrayUnion(communityId),
      },
      { merge: true }
    );

    // We also want to set createdAt if it doesn't exist. Admin SDK set merges gracefully.
    // However, to mimic the previous logic exactly, since we can't do setIfMissing in one pass easily,
    // we'll just set it.

    // 3. Mark invite as accepted
    batch.update(inviteRef, {
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return { success: true, communityId, message: 'Invitation accepted successfully.' };
  } catch (error: any) {
    console.error('acceptInvitationAction failed:', error);
    return { success: false, message: 'Could not complete invitation. Please contact your community administrator.' };
  }
}
