
// src/lib/patriarch-actions.ts
'use server';

import { getAdminInfo } from './firebase-admin';
import { db, auth } from './firebase'; // Use client SDK for some checks for consistency
import { collection, doc, addDoc, serverTimestamp, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { sendInvitationEmail } from '@/lib/email';
import type { NewMemberData, Member } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Re-using the admin initialization from the existing setup
const adminDb = getAdminInfo().db;

/**
 * Utility: Checks if a user is the patriarch of a given family OR an admin/owner of the community.
 * This runs with admin privileges to check roles and family data securely.
 */
async function isPatriarchOrAdmin(communityId: string, familyName: string, uid: string): Promise<boolean> {
  const memberRef = adminDb.doc(`communities/${communityId}/members/${uid}`);
  const memberSnap = await memberRef.get();
  
  if (!memberSnap.exists) {
    console.error(`isPatriarchOrAdmin check failed: Caller UID ${uid} is not a member of community ${communityId}.`);
    return false;
  }
  
  const member = memberSnap.data() as Member;

  // Admins/owners always have permission.
  if (['owner', 'admin'].includes(member.role)) {
    return true;
  }

  // If they are not an admin, they must be a patriarch of the specific family.
  if (member.isPatriarch && member.family === familyName) {
    return true;
  }
  
  console.error(`isPatriarchOrAdmin check failed: User ${uid} is not an admin or the patriarch of family "${familyName}".`);
  return false;
}

// NOTE: This function is very similar to `inviteMember` in CommunityProvider, but runs on the server
// with elevated privileges after performing a security check.
export async function inviteMemberAsPatriarchAction(
    communityId: string,
    callerUid: string,
    communityName: string,
    inviterName: string,
    data: NewMemberData
): Promise<{ success: boolean; message: string; }> {
    if (!communityId || !callerUid || !data.family || !data.email) {
        return { success: false, message: 'Missing required fields for invitation.' };
    }

    const isAuthorized = await isPatriarchOrAdmin(communityId, data.family, callerUid);
    if (!isAuthorized) {
        return { success: false, message: 'You are not authorized to invite members to this family.' };
    }

    try {
        const fullName = [data.firstName, data.middleName, data.lastName]
            .filter(part => part && part.trim())
            .join(' ');
        
        await sendInvitationEmail({
            to: data.email,
            communityId,
            communityName,
            inviterName,
            memberData: { ...data, email: data.email },
        });
        
        revalidatePath(`/app/${communityId}`);
        return { success: true, message: `Invitation sent to ${fullName}.` };

    } catch (error: any) {
        console.error('inviteMemberAsPatriarchAction failed:', error);
        return { success: false, message: error.message || 'An unknown error occurred.' };
    }
}

// NOTE: This function is very similar to `addMember` in CommunityProvider, but runs on the server
// with elevated privileges after performing a security check.
export async function addMemberAsPatriarchAction(
    communityId: string,
    callerUid: string,
    data: NewMemberData
): Promise<{ success: boolean; message: string; }> {
     if (!communityId || !callerUid || !data.family) {
        return { success: false, message: 'Missing required fields for adding a member.' };
    }
    
    const isAuthorized = await isPatriarchOrAdmin(communityId, data.family, callerUid);
    if (!isAuthorized) {
        return { success: false, message: 'You are not authorized to add members to this family.' };
    }
    
    try {
        const fullName = [data.firstName, data.middleName, data.lastName]
            .filter(part => part && part.trim())
            .join(' ');

        const joinDate = new Date().toISOString();

        const newMember = {
            name: fullName,
            firstName: data.firstName,
            middleName: data.middleName || '',
            lastName: data.lastName,
            family: data.family,
            email: data.email || '',
            phone: data.phone || '',
            phoneCountryCode: data.phoneCountryCode || '',
            gender: data.gender,
            tier: data.tier,
            payments: [],
            joinDate: joinDate,
            role: 'user' as const, // Patriarchs can only add users
            status: 'active' as const,
            uid: null,
            isPatriarch: false,
            contribution: 0,
        };

        await adminDb.collection(`communities/${communityId}/members`).add(newMember);

        revalidatePath(`/app/${communityId}`);
        return { success: true, message: `${fullName} has been added to the family.` };

    } catch (error: any) {
        console.error('addMemberAsPatriarchAction failed:', error);
        return { success: false, message: error.message || 'An unknown error occurred.' };
    }
}
