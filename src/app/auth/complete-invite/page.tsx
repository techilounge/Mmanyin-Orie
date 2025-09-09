'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { db, auth } from '@/lib/firebase';
import { notifyAdminsOwnerNewMember } from '@/lib/notify-new-member';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function fetchInviteByToken(token: string) {
    const inviteRef = doc(db, 'invitations', token);
    const snap = await getDoc(inviteRef);
    if (!snap.exists()) {
        throw new Error('This invitation link is invalid or has expired.');
    }
    return { id: snap.id, ...snap.data() } as any;
}


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
        return;
    }

    const processInvite = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch the invitation by ID
        const invite = await fetchInviteByToken(token);

        if (invite.status !== 'pending') {
          throw new Error('This invitation is no longer available or has been used.');
        }
        if (!user?.email || user.email.toLowerCase() !== String(invite.email).toLowerCase()) {
            throw new Error('This invitation does not match the signed-in user.');
        }

        const communityId: string = invite.communityId;

        // 2. Create/merge the caller's member doc (allowed by rules)
        const myMemberRef = doc(db, `communities/${communityId}/members/${user.uid}`);
        await setDoc(myMemberRef, {
            uid: user.uid,
            email: user.email,
            role: 'user',
            status: 'active',
            family: invite.family || 'Unassigned',
            name: user.displayName || user.email,
            firstName: invite.firstName || '',
            lastName: invite.lastName || '',
            middleName: '',
            tier: invite.tier || 'N/A',
            gender: invite.gender || 'male',
            joinDate: new Date().toISOString(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        // 3. Update the user profile memberships
        const userRef = doc(db, `users/${user.uid}`);
        await updateDoc(userRef, {
            memberships: arrayUnion(communityId),
            updatedAt: serverTimestamp()
        });

        // 4. Mark invitation accepted
        const inviteRef = doc(db, 'invitations', token);
        await updateDoc(inviteRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp(),
            acceptedByUid: user.uid,
        });

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
