'use server';
import { Resend } from 'resend';
import InvitationEmail from '@/emails/invitation-email';

interface SendInvitationEmailParams {
  to: string;
  communityName: string;
  inviteLink: string;
  inviterName:string;
}

export async function sendInvitationEmail({
  to,
  communityName,
  inviteLink,
  inviterName,
}: SendInvitationEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendDomain = process.env.RESEND_DOMAIN;

  if (!resendApiKey) {
    const message = "Email sending is not configured. Administrator must set a Resend API key.";
    console.error(message);
    throw new Error(message);
  }
  
  if (!resendDomain) {
    const message = "Email sending is not configured. Administrator must set a Resend domain.";
    console.error(message);
    throw new Error(message);
  }

  try {
    const resend = new Resend(resendApiKey);
    
    const { data, error } = await resend.emails.send({
      from: `Mmanyin Orie <no-reply@${resendDomain}>`,
      to: [to],
      subject: `Invitation to join ${communityName}`,
      react: InvitationEmail({ communityName, inviteLink, inviterName }),
      text: `You have been invited to join ${communityName}. Accept your invitation here: ${inviteLink}`,
    });

    if (error) {
      console.error('Resend API Error:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    // Re-throw the original error to be handled by the caller
    throw error;
  }
}
