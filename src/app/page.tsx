'use client';
import { CommunityProvider } from '@/components/community/community-provider';
import { CommunityApp } from '@/components/community/community-app';

export default function Home() {
  return (
    <CommunityProvider>
      <CommunityApp />
    </CommunityProvider>
  );
}
