'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
  getDoc,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { db, auth } from '@/lib/firebase';
import { notifyAdminsOwnerNewMember } from '@/lib/notify-new-member';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompleteInvitePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get('token') ?? '';
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!token) {
        setError('Missing or invalid invitation token.');
        setIsLoading(false);
        return;
    }

    if (!user) {
        // Auth context is loading or user is not signed in.
        // The auth guard will handle redirection to sign-in page.
        return;
    }

    const processInvite = async () => {
      setIsLoading(true);
      try {
        const invitesRef = collection(db, 'invitations');
        const q = query(invitesRef, where('token', '==', token), limit(1));
        const snap = await getDocs(q);

        if (snap.empty) {
          throw new Error('This invitation link is invalid or has expired.');
        }

        const inviteDoc = snap.docs[0];
        const invite = inviteDoc.data() as any;

        if (invite.status !== 'pending') {
          throw new Error('This invitation has already been used or has expired.');
        }
        if (invite.expiresAt?.toDate && invite.expiresAt.toDate() < new Date()) {
           throw new Error('This invitation has expired.');
        }

        const communityId: string = invite.communityId;
        const invitedMemberId: string = invite.memberId;
        
        if (!communityId || !invitedMemberId) {
            throw new Error('This invitation is corrupted and cannot be processed.');
        }
        
        // Use a write batch for atomic operations
        const batch = writeBatch(db);

        // 1. Get the original member document created at invite time
        const memberSrcRef = doc(db, 'communities', communityId, 'members', invitedMemberId);
        const srcSnap = await getDoc(memberSrcRef);
        if (!srcSnap.exists()) {
          throw new Error('The original member record for this invite could not be found.');
        }
        const srcData = srcSnap.data();

        // 2. Define the new member document reference using the user's actual UID
        const memberDstRef = doc(db, 'communities', communityId, 'members', user.uid);
        
        // 3. Create or update the definitive member document
        const mergedMemberData = {
          ...srcData,
          uid: user.uid,
          email: user.email ?? srcData.email,
          name: user.displayName ?? srcData.name,
          status: 'active',
          joinDate: new Date().toISOString(), // Or keep original invite date if preferred
        };
        batch.set(memberDstRef, mergedMemberData, { merge: true });
        
        // 4. If the source ID is different, delete the original temporary member doc
        if (memberSrcRef.id !== memberDstRef.id) {
          batch.delete(memberSrcRef);
        }

        // 5. Update the user's main document with the new community membership
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, {
            memberships: arrayUnion(communityId)
        });

        // 6. Mark the invitation as accepted
        batch.update(inviteDoc.ref, {
          status: 'accepted',
          acceptedByUid: user.uid,
          acceptedAt: serverTimestamp(),
        });

        // Commit all changes at once
        await batch.commit();

        // Notify admins (best-effort, after the critical transaction)
        await notifyAdminsOwnerNewMember({
            communityId,
            communityName: invite.communityName || 'the community',
            memberUid: user.uid,
            memberDisplayName: user.displayName,
            memberEmail: user.email,
        }).catch(e => console.warn("Failed to send new member notification:", e));

        // Redirect to the community
        router.replace(`/app/${communityId}`);
        
      } catch (e: any) {
        setError(e?.message ?? 'An unknown error occurred. Please contact support.');
        setIsLoading(false);
      }
    };

    processInvite();

  }, [token, router, user]);

  if (isLoading) {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
            <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <h1 className="text-2xl font-semibold">Completing your invitation...</h1>
            </div>
            <p className="mt-4 text-muted-foreground">Please wait while we set up your account.</p>
        </div>
      );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="mb-2 text-xl font-semibold text-destructive">Invitation Error</h1>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/')}>Return to Home</Button>
      </div>
    );
  }

  return null; // Should redirect on success
}
