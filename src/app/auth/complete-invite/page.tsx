'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getApp, getApps, initializeApp,
} from 'firebase/app';
import {
  getAuth, onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// This page uses its own Firebase instance to avoid circular dependencies
// with the main AuthProvider during the critical invite-completion step.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig as any);
  return { app, db: getFirestore(app), auth: getAuth(app) };
}

export default function CompleteInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [msg, setMsg] = useState('Completing your invitation…');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { db, auth } = getFirebase();

    const run = async () => {
      if (!token) {
        setError('Invalid invitation link.');
        return;
      }

      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, (u) => {
          if (u) resolve();
        });
        // If already signed in, this resolves immediately:
        setTimeout(() => resolve(), 500);
        return () => unsub();
      });

      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to accept your invitation.');
        router.push(`/auth/sign-in?next=/auth/complete-invite?token=${encodeURIComponent(token)}`);
        return;
      }

      // 1) Load invitation
      const inviteRef = doc(db, 'invitations', token);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists() || inviteSnap.data().status !== 'pending') {
        setError('This invitation is invalid, has expired, or has already been used.');
        return;
      }
      const invite = inviteSnap.data() as {
        communityId: string;
        email?: string;
        family?: string;
        tier?: string;
        firstName?: string;
        lastName?: string;
        gender?: 'male' | 'female';
        placeholderMemberId?: string;
      };

      // (Soft) email match guard
      if (invite.email && user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
        setError('This invitation was sent to a different email address.');
        return;
      }

      // 2) Create/merge the UID-keyed membership document
      const memberRef = doc(db, 'communities', invite.communityId, 'members', user.uid);
      await setDoc(
        memberRef,
        {
          uid: user.uid,
          email: user.email ?? '',
          name: user.displayName ?? `${invite.firstName} ${invite.lastName}`.trim(),
          firstName: invite.firstName || '',
          lastName: invite.lastName || '',
          middleName: '',
          gender: invite.gender || 'male',
          role: 'user', // invitees are always plain users
          status: 'active',
          joinDate: new Date().toISOString(),
          family: invite.family ?? 'Unassigned',
          tier: invite.tier ?? 'N/A',
        },
        { merge: true }
      );

      // 3) Add community to user's memberships array
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { memberships: arrayUnion(invite.communityId) }).catch(async () => {
        // if user doc doesn't exist yet (rare), create it
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          photoURL: user.photoURL ?? '',
          memberships: [invite.communityId],
          createdAt: serverTimestamp(),
        }, { merge: true });
      });

      // 4) Mark invitation as accepted
      await updateDoc(inviteRef, { status: 'accepted', acceptedAt: serverTimestamp(), acceptedByUid: user.uid }).catch(() => {});

      setMsg('Invitation accepted. Redirecting…');
      router.replace(`/app/${invite.communityId}`);
    };

    run().catch((e) => {
      console.error(e);
      setError('Could not complete invitation. Please contact your community administrator.');
    });
  }, [router, token]);


  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="mb-2 text-xl font-semibold text-destructive">Invitation Error</h1>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/')}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
        <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <h1 className="text-2xl font-semibold">{msg}</h1>
        </div>
        <p className="mt-4 text-muted-foreground">Please wait while we set up your account.</p>
    </div>
  );
}
