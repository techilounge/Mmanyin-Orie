'use client';
import { useContext } from 'react';
import { CommunityContext } from '@/components/community/community-provider';

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
