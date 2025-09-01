
import * as React from 'react';
import { Html, Button, Heading, Text, Section, Container } from '@react-email/components';

interface InvitationEmailProps {
  communityName: string;
  inviterName: string;
  inviteLink: string;
}

export const InvitationEmail: React.FC<Readonly<InvitationEmailProps>> = ({
  communityName,
  inviterName,
  inviteLink,
}) => (
  <Html>
    <Container style={main}>
      <Heading style={heading}>Join {communityName} on Mmanyin Orie</Heading>
      <Section style={content}>
        <Text style={paragraph}>Hello,</Text>
        <Text style={paragraph}>
          You've been invited by {inviterName} to join the {communityName} community.
          Click the button below to accept your invitation and set up your account.
        </Text>
        <Section style={{ textAlign: 'center', marginTop: '26px' }}>
          <Button style={button} href={inviteLink}>
            Accept Invitation
          </Button>
        </Section>
        <Text style={paragraph}>
          If the button above doesn't work, you can copy and paste this link into your browser:
        </Text>
        <Text style={linkStyle}>{inviteLink}</Text>
      </Section>
      <Text style={footer}>Mmanyin Orie Community Platform</Text>
    </Container>
  </Html>
);

export default InvitationEmail;

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const content = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1e293b',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#475569',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const linkStyle = {
  ...paragraph,
  color: '#4f46e5',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
};
