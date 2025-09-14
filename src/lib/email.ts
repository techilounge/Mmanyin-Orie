
'use server';
import { Resend } from 'resend';
import InvitationEmail from '@/emails/invitation-email';
import NewMemberEmail from '@/emails/new-member-email';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { NewMemberData } from './types';

interface SendInvitationEmailParams {
  to: string;
  communityId: string;
  communityName: string;
  inviterName: string;
  memberData: Omit<NewMemberData, 'email'> & { email: string };
  newFamilyName?: string;
}

interface SendNewMemberNotificationParams {
    communityId: string;
    communityName: string;
    newMemberName: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Build a valid "from" per Resend rules.
// Prefer RESEND_FROM = "Mmanyin Orie <no-reply@mmanyinorie.com>"
function buildFrom(): string {
  const fromEnv = process.env.RESEND_FROM?.trim();
  const domainEnv = process.env.RESEND_DOMAIN?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (fromEnv) {
    // Allow "email@domain" or "Name <email@domain>"
    const ok =
      /^([^<>@]+<)?([^<>@\s]+@[^<>@\s]+\.[^<>@\s]+)(>)?$/.test(fromEnv);
    if (!ok) {
      throw new Error('RESEND_FROM must be "email@example.com" or "Name <email@example.com>"');
    }
    // If only email is provided, format it correctly.
    if (!fromEnv.includes('<')) {
        return `Mmanyin Orie <${fromEnv}>`;
    }
    return fromEnv;
  }

  if (domainEnv) {
    // Strip scheme, www., and any path/query
    const domain = domainEnv
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim();

    const email = `no-reply@${domain}`;
    if (!EMAIL_RE.test(email)) {
      throw new Error('RESEND_DOMAIN/NEXT_PUBLIC_APP_URL must be a bare domain like "example.com" (no https://, no path).');
    }
    return `Mmanyin Orie <${email}>`;
  }

  throw new Error('Email sending is not configured. Set RESEND_FROM, RESEND_DOMAIN, or NEXT_PUBLIC_APP_URL.');
}

function sanitizeRecipient(v: string): string {
  // Trim whitespace and trailing punctuation commonly added in UI text.
  const cleaned = v.trim().replace(/[)\].,;:!?]+$/, '');
  if (!EMAIL_RE.test(cleaned)) {
    throw new Error('Recipient email is invalid.');
  }
  return cleaned;
}

export async function sendInvitationEmail({
  to,
  communityId,
  communityName,
  inviterName,
  memberData,
  newFamilyName,
}: SendInvitationEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    const message = 'Email sending is not configured. Administrator must set RESEND_API_KEY.';
    console.error(message);
    throw new Error(message);
  }

  const from = buildFrom();
  const recipient = sanitizeRecipient(to);
  const user = auth.currentUser;

  // This function now also creates the Firestore documents
  const batch = writeBatch(db);

  let familyToUse = memberData.family;
  if (newFamilyName && newFamilyName.trim() && memberData.family === 'new') {
      familyToUse = newFamilyName.trim();
      const familyDocRef = doc(collection(db, `communities/${communityId}/families`));
      batch.set(familyDocRef, { name: familyToUse });
  }

  const fullName = [memberData.firstName, memberData.middleName, memberData.lastName]
      .filter(part => part && part.trim())
      .join(' ');
  
  const memberDocRef = doc(collection(db, `communities/${communityId}/members`));
  const inviteDocRef = doc(collection(db, 'invitations'));
  
  const newMemberBase = {
      name: fullName,
      firstName: memberData.firstName,
      middleName: memberData.middleName || '',
      lastName: memberData.lastName,
      family: familyToUse,
      email: memberData.email,
      phone: memberData.phone || '',
      phoneCountryCode: memberData.phoneCountryCode || '',
      gender: memberData.gender,
      tier: memberData.tier,
      payments: [],
      joinDate: new Date().toISOString(),
      role: 'user' as const,
      status: 'invited' as const,
      uid: null,
      isPatriarch: memberData.isPatriarch,
      inviteId: inviteDocRef.id,
      contribution: 0, // Default contribution
  };
  
  batch.set(memberDocRef, newMemberBase);

  batch.set(inviteDocRef, {
      communityId: communityId,
      communityName: communityName,
      memberId: memberDocRef.id,
      email: memberData.email,
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      gender: memberData.gender,
      family: familyToUse,
      tier: memberData.tier,
      role: 'user',
      isPatriarch: memberData.isPatriarch, // preserve patriarch flag
      status: 'pending',                  // REQUIRED by rules
      createdAt: serverTimestamp(),
      createdBy: user?.uid ?? 'system',
  });

  await batch.commit();
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const inviteLink = `${appUrl}/auth/accept-invite?token=${inviteDocRef.id}`;


  try {
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: [recipient],
      subject: `Invitation to join ${communityName}`,
      react: InvitationEmail({ communityName, inviteLink, inviterName }),
      text: `You have been invited to join ${communityName}. Accept your invitation here: ${inviteLink}`,
    });

    if (error) {
      console.error('Resend API Error:', error);
      throw new Error(error.message);
    }

    return { data, success: true };
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
}

export async function sendNewMemberNotificationEmail({
  communityId,
  communityName,
  newMemberName,
}: SendNewMemberNotificationParams) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        console.error('Email sending is not configured (RESEND_API_KEY missing).');
        return; // Don't throw, as this is a non-critical notification
    }

    try {
        // 1. Find all admins and owners of the community
        const membersRef = collection(db, 'communities', communityId, 'members');
        const q = query(membersRef, where('role', 'in', ['admin', 'owner']));
        const querySnapshot = await getDocs(q);

        const recipients: string[] = [];
        querySnapshot.forEach(doc => {
            const member = doc.data();
            if (member.email && EMAIL_RE.test(member.email)) {
                recipients.push(member.email);
            }
        });

        if (recipients.length === 0) {
            console.log('No admin/owner recipients found for new member notification.');
            return;
        }

        // 2. Send the email
        const resend = new Resend(resendApiKey);
        const from = buildFrom();

        const { data, error } = await resend.emails.send({
            from,
            to: recipients,
            subject: `New Member Joined ${communityName}`,
            react: NewMemberEmail({ communityName, newMemberName }),
            text: `${newMemberName} has just joined the ${communityName} community.`,
        });
        
        if (error) {
            console.error('Resend API Error (New Member Notification):', error);
            // Don't throw, just log the error
        }

        return data;

    } catch (error) {
        console.error('Failed to send new member notification email:', error);
        // Don't throw, just log the error
    }
}
