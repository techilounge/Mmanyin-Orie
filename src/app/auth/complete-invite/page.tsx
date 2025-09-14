
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc, getDoc, setDoc, updateDoc,
  serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const token = params.get('token') ?? '';

  const [message, setMessage] = useState('Completing your invitation…');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { db, auth } = getFirebase();

    const run = async () => {
      if (!token) {
        setError('Invalid invitation link.');
        return;
      }

      // Ensure we’re signed in
      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, () => resolve());
        setTimeout(() => resolve(), 500); // Give auth state a moment
        return () => unsub();
      });

      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to accept your invitation.');
        router.replace(`/auth/sign-in?next=/auth/complete-invite?token=${encodeURIComponent(token)}`);
        return;
      }

      // 1) Load invite
      const inviteRef = doc(db, 'invitations', token);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) {
        setError('This invitation is invalid or has expired.');
        return;
      }
      const invite = inviteSnap.data() as {
        communityId: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        gender?: 'male' | 'female';
        family?: string;
        tier?: string;
        status?: string;
        isPatriarch?: boolean;
      };

      if (invite.email && user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
        setError('This invitation was sent to a different email address.');
        return;
      }

      // 2) Create/merge UID-keyed member doc — THIS satisfies your rules:
      //    role must be 'user' and status must be in ['active','accepted','member'].
      const memberRef = doc(db, 'communities', invite.communityId, 'members', user.uid);
      await setDoc(
        memberRef,
        {
          uid: user.uid,
          email: user.email ?? '',
          name: user.displayName ?? `${invite.firstName ?? ''} ${invite.lastName ?? ''}`.trim(),
          firstName: invite.firstName ?? '',
          lastName: invite.lastName ?? '',
          middleName: '',
          gender: invite.gender ?? 'male',
          role: 'user',
          status: 'active', // <-- REQUIRED by your rules
          joinDate: serverTimestamp(),
          family: invite.family ?? 'Unassigned',
          tier: invite.tier ?? 'N/A',
          isPatriarch: invite.isPatriarch ?? false,
        },
        { merge: true }
      );

      // 3) Ensure user doc + memberships
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, { memberships: arrayUnion(invite.communityId) });
      } catch {
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? '',
            photoURL: user.photoURL ?? '',
            memberships: [invite.communityId],
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // 4) Mark invite accepted (allowed fields only)
      try {
        await updateDoc(inviteRef, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        });
      } catch {
        // ignore failure; membership is created
      }

      setMessage('Invitation accepted. Redirecting…');
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
            <h1 className="text-2xl font-semibold">{message}</h1>
        </div>
        <p className="mt-4 text-muted-foreground">Please wait while we set up your account.</p>
    </div>
  );
}
