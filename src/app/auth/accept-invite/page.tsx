
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  collection, doc, getDoc, getDocs, query, where,
  orderBy, limit as qlimit
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';

type InviteDoc = {
  communityId: string;
  email?: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAt?: any;
  expiresAt?: any;
  communityName?: string;
  replacedBy?: string;
};

export default function AcceptInvitePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = useMemo(() => sp.get('token')?.trim() ?? '', [sp]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDoc | null>(null);
  const [communityName, setCommunityName] = useState<string>('Community');

  useEffect(() => {
    let unsub = () => {};
    async function run() {
      try {
        if (!token) {
          setErr('Invalid invitation link (missing token).');
          setLoading(false);
          return;
        }

        // Ensure auth state is resolved (your flow likely already signs-in first)
        await new Promise<void>((resolve) => {
          unsub = onAuthStateChanged(auth, () => resolve());
        });

        const snap = await getDoc(doc(db, 'invitations', token));
        if (!snap.exists()) {
          setErr('This invitation could not be found.');
          setLoading(false);
          return;
        }
        const inv = snap.data() as InviteDoc;

        // Optional expiry check
        const isExpired =
          inv.expiresAt && inv.expiresAt.toMillis && inv.expiresAt.toMillis() < Date.now();

        // If not pending (or expired), try to locate the latest pending invite
        if (inv.status !== 'pending' || isExpired) {
          // If a newer token replaced this one, prefer that
          if (inv.replacedBy) {
            router.replace(`/auth/accept-invite?token=${inv.replacedBy}`);
            return;
          }

          // Otherwise look up the newest pending invite for the same receiver + community
          if (inv.communityId && inv.email) {
            const q = query(
              collection(db, 'invitations'),
              where('communityId', '==', inv.communityId),
              where('email', '==', inv.email),
              where('status', '==', 'pending'),
              orderBy('createdAt', 'desc'),
              qlimit(1)
            );
            const newer = await getDocs(q);
            if (!newer.empty && newer.docs[0].id !== token) {
              router.replace(`/auth/accept-invite?token=${newer.docs[0].id}`);
              return;
            }
          }

          setErr('This invitation has already been used or has expired.');
          setLoading(false);
          return;
        }

        setInvite(inv);
        setCommunityName(inv.communityName || 'Community');

      } catch (e: any) {
        setErr(e?.message || 'Failed to retrieve invitation details.');
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => unsub();
  }, [token, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted-foreground">Loading invitation…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="mb-2 text-xl font-semibold">Invitation Error</h1>
        <p className="mb-6 text-muted-foreground">{err}</p>
        <Button onClick={() => router.push('/auth/sign-in')}>Return to Sign In</Button>
      </div>
    );
  }

  // Your existing “Accept” action still applies; route wherever you do the join
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="mb-2 text-xl font-semibold">You’re invited</h1>
      <p className="mb-6 text-muted-foreground">
        You’ve been invited to join <span className="font-medium">{communityName}</span>.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button variant="secondary" onClick={() => router.push('/')}>Cancel</Button>
        <Button onClick={() => router.push(`/auth/complete-invite?token=${token}`)}>
          Continue
        </Button>
      </div>
    </div>
  );
}
