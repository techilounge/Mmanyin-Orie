
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
  id: string;
  communityId: string;
  email?: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAt?: any;
  expiresAt?: any;
  communityName?: string;
  replacedBy?: string;
};

async function fetchInviteByToken(token: string): Promise<InviteDoc> {
    const inviteRef = doc(db, 'invitations', token);
    const snap = await getDoc(inviteRef);
    if (!snap.exists()) {
        throw new Error('This invitation link is invalid or has expired.');
    }
    return { id: snap.id, ...snap.data() } as InviteDoc;
}


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

        // Ensure auth state is resolved
        await new Promise<void>((resolve) => {
          unsub = onAuthStateChanged(auth, () => resolve());
        });
        
        const inv = await fetchInviteByToken(token);

        // Optional expiry check
        const isExpired =
          inv.expiresAt && inv.expiresAt.toMillis && inv.expiresAt.toMillis() < Date.now();

        if (inv.status !== 'pending' || isExpired) {
          if (inv.replacedBy) {
            router.replace(`/auth/accept-invite?token=${inv.replacedBy}`);
            return;
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
