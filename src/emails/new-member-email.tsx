
import * as React from 'react';
import { Html, Button, Heading, Text, Section, Container } from '@react-email/components';

interface NewMemberEmailProps {
  communityName: string;
  newMemberName: string;
}

export const NewMemberEmail: React.FC<Readonly<NewMemberEmailProps>> = ({
  communityName,
  newMemberName,
}) => (
  <Html>
    <Container style={main}>
      <Heading style={heading}>New Member Alert</Heading>
      <Section style={content}>
        <Text style={paragraph}>Hello,</Text>
        <Text style={paragraph}>
          A new member, <strong>{newMemberName}</strong>, has just joined the <strong>{communityName}</strong> community on Mmanyin Orie.
        </Text>
        <Text style={paragraph}>
          You can view the updated member list in your community dashboard.
        </Text>
      </Section>
      <Text style={footer}>Mmanyin Orie Community Platform</Text>
    </Container>
  </Html>
);

export default NewMemberEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const content = {
  backgroundColor: '#ffffff',
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

const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
};
