
'use server';
import { Resend } from 'resend';
import InvitationEmail from '@/emails/invitation-email';

interface SendInvitationEmailParams {
  to: string;
  communityName: string;
  inviteLink: string;
  inviterName: string;
}

export async function sendInvitationEmail({
  to,
  communityName,
  inviteLink,
  inviterName,
}: SendInvitationEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Cannot send email.");
    // Throw an error that can be caught by the calling function
    throw new Error("Email sending is not configured. Administrator must set a Resend API key.");
  }

  try {
    // Initialize Resend inside the function, only when we know the key exists.
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: `Mmanyin Orie <no-reply@${process.env.NEXT_PUBLIC_RESEND_DOMAIN || 'resend.dev'}>`,
      to: [to],
      subject: `Invitation to join ${communityName}`,
      react: InvitationEmail({ communityName, inviteLink, inviterName }),
      text: `You have been invited to join ${communityName}. Accept your invitation here: ${inviteLink}`,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    // Re-throw the error so it can be caught by the calling function
    throw new Error("Could not send the invitation email.");
  }
}
