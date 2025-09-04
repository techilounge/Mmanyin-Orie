
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, writeBatch, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { notifyAdminsOwnerNewMember } from '@/lib/notify-new-member';
import type { InviteDoc } from '@/lib/invitations';

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
      const { communityId, memberId } = invite;

      if (!memberId) {
        throw new Error("This invitation is corrupted and not linked to a member.");
      }

      if (appUser.memberships?.includes(communityId)) {
        // Already a member. Just mark as accepted and redirect.
        await updateDoc(inviteRef, { status: 'accepted' });
        toast({ title: "Already a member", description: "You are already a member of this community." });
        router.push(`/app/${communityId}`);
        return;
      }

      const batch = writeBatch(db);

      // 1. Update the user document with the new membership
      const userDocRef = doc(db, 'users', user.uid);
      batch.update(userDocRef, { memberships: arrayUnion(communityId) });
      
      // 2. Update the member document using the stable memberId from the invite
      const memberRef = doc(db, 'communities', communityId, 'members', memberId);
      batch.update(memberRef, {
        status: 'active',
        uid: user.uid,
        email: user.email, // Sync email on join
        name: user.displayName, // Sync name on join
      });

      // 3. Mark the invitation as accepted
      batch.update(inviteRef, {
        status: 'accepted',
        acceptedByUid: user.uid,
        acceptedAt: new Date(),
      })

      await batch.commit();
      
      await notifyAdminsOwnerNewMember({
        communityId: communityId,
        communityName: invite.communityName || 'your community',
        memberUid: user.uid,
        memberDisplayName: user.displayName,
        memberEmail: user.email,
      });

      toast({
        title: 'Welcome!',
        description: `You have successfully joined ${invite.communityName || 'the community'}.`,
      });

      router.push(`/app/${communityId}`);

    } catch (err: any) {
      console.error("Failed to process invitation:", err);
      setError(err.message || 'Failed to process your invitation. Please contact support.');
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
