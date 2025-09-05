'use server';
import { Resend } from 'resend';
import InvitationEmail from '@/emails/invitation-email';

interface SendInvitationEmailParams {
  to: string;
  communityName: string;
  inviteLink: string;
  inviterName: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Build a valid "from" per Resend rules.
// Prefer RESEND_FROM = "Mmanyin Orie <no-reply@mmanyinorie.com>"
function buildFrom(): string {
  const fromEnv = process.env.RESEND_FROM?.trim();
  const domainEnv = process.env.RESEND_DOMAIN?.trim();

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
      throw new Error('RESEND_DOMAIN must be a bare domain like "example.com" (no https://, no path).');
    }
    return `Mmanyin Orie <${email}>`;
  }

  throw new Error('Email sending is not configured. Set RESEND_FROM or RESEND_DOMAIN.');
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
  communityName,
  inviteLink,
  inviterName,
}: SendInvitationEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    const message = 'Email sending is not configured. Administrator must set RESEND_API_KEY.';
    console.error(message);
    throw new Error(message);
  }

  const from = buildFrom();
  const recipient = sanitizeRecipient(to);

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

    return data;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
}
