
'use client';
import { useState } from 'react';
import { CommunityProvider } from '@/components/community/community-provider';
import { CommunityApp } from '@/components/community/community-app';
import { useParams } from 'next/navigation';

export default function CommunityPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <CommunityProvider communityId={communityId}>
      <CommunityApp activeTab={activeTab} setActiveTab={setActiveTab} />
    </CommunityProvider>
  );
}
