
'use client';
import { CommunityProvider } from '@/components/community/community-provider';
import { CommunityApp } from '@/components/community/community-app';
import { useParams } from 'next/navigation';

export default function CommunityPage() {
  const params = useParams();
  const communityId = params.communityId as string;

  return (
    <CommunityProvider communityId={communityId}>
      <CommunityApp />
    </CommunityProvider>
  );
}
