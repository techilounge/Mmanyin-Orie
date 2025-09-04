
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { markInviteAccepted } from '@/lib/invitations';
import { notifyAdminsOwnerNewMember } from '@/lib/notify-new-member';
import type { InviteDoc } from '@/lib/invitations';
import type { AppUser } from '@/lib/types';


export default function CompleteInvitePage() {
  const { user, appUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const sp = useSearchParams();
  const token = useMemo(() => sp.get('token')?.trim() ?? '', [sp]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processInvite = async () => {
    if (!user || !appUser || !token) {
      setError('You must be signed in to accept an invitation.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const inviteRef = doc(db, 'invitations', token);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists() || inviteSnap.data().status !== 'pending') {
        setError('This invitation is invalid or has already been used.');
        setIsLoading(false);
        return;
      }
      
      const invite = inviteSnap.data() as InviteDoc;
      const { communityId, email: inviteEmail } = invite;

      if (inviteEmail.toLowerCase() !== user.email?.toLowerCase()) {
          setError("This invitation is for a different email address.");
          setIsLoading(false);
          return;
      }

      // Check if user is already a member of this community
      if (appUser.memberships?.includes(communityId)) {
        await markInviteAccepted(token); // Mark as used anyway
        toast({ title: "Already a member", description: "You are already a member of this community." });
        router.push(`/app/${communityId}`);
        return;
      }

      const batch = writeBatch(db);

      // 1. Update the user document with the new membership
      const userDocRef = doc(db, 'users', user.uid);
      batch.update(userDocRef, {
        memberships: arrayUnion(communityId)
      });
      
      // 2. Find the invited member doc and update its status and UID
      const memberRef = doc(db, 'communities', communityId, 'members', invite.memberId);
      batch.update(memberRef, {
        status: 'active',
        uid: user.uid
      });

      // 3. Mark the invitation as accepted
      batch.update(inviteRef, {
          status: 'accepted',
          acceptedByUid: user.uid,
          acceptedAt: new Date(),
      })

      // Commit all writes
      await batch.commit();
      
      // Send notification email
      await notifyAdminsOwnerNewMember({
        communityId: communityId,
        communityName: invite.communityName || 'your community',
        memberUid: user.uid,
        memberDisplayName: user.displayName,
        memberEmail: user.email
      });

      toast({
        title: 'Welcome!',
        description: `You have successfully joined ${invite.communityName || 'the community'}.`,
      });

      router.push(`/app/${communityId}`);

    } catch (err: any) {
      console.error("Failed to process invitation:", err);
      setError('Failed to process your invitation. Please contact support.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'An unknown error occurred.',
      });
      setIsLoading(false);
    }
  };

  if (error) {
     return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="mb-2 text-xl font-semibold">Invitation Error</h1>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/auth/sign-in')}>Return to Sign In</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Finalizing your membership...</h1>
        <p className="text-muted-foreground mb-8">
            Click the button below to complete the process and join the community.
        </p>
        <Button onClick={processInvite} disabled={isLoading}>
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                </>
            ) : "Complete My Invitation"}
        </Button>
    </div>
  );
}
