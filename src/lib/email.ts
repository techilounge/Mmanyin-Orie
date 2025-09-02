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
    console.error("RESEND_API_KEY is not set. Cannot send email.");
    throw new Error("Email sending is not configured. Administrator must set a Resend API key.");
  }
  
  if (!resendDomain) {
    console.error("RESEND_DOMAIN is not set. Cannot send email.");
    throw new Error("Email sending is not configured. Administrator must set a Resend domain.");
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
    throw new Error("Could not send the invitation email. Please check server logs for details.");
  }
}
