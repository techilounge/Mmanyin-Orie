'use client';
import { CommunityProvider } from '@/components/community/community-provider';
import { CommunityApp } from '@/components/community/community-app';

export default function DashboardPage() {
  return (
    <CommunityProvider>
      <CommunityApp />
    </CommunityProvider>
  );
}
