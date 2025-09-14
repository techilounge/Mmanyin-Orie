'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('Verifying invitation...');

  useEffect(() => {
    const { db, auth } = getFirebase();

    const run = async () => {
      if (!token) {
        setError('Invalid invitation link. No token provided.');
        return;
      }

      // 1. Try to read the invitation. Firestore allows this if status is 'pending'.
      try {
        const inviteSnap = await getDoc(doc(db, 'invitations', token));
        if (!inviteSnap.exists()) {
          setError('This invitation link is invalid or has expired.');
          return;
        }
        if (inviteSnap.data().status !== 'pending') {
            setError('This invitation has already been accepted or is no longer valid.');
            return;
        }
      } catch (e: any) {
        // If rules block the read, it means the invite is not 'pending' or invalid.
        console.error('Failed to fetch invitation:', e);
        setError('This invitation link appears to be invalid or has expired.');
        return;
      }

      // 2. Resolve auth state.
      setMessage('Checking authentication...');
      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, () => resolve());
      });

      // 3. Redirect to complete the process or to sign-in page.
      const user = auth.currentUser;
      const redirectUrl = `/auth/complete-invite?token=${encodeURIComponent(token)}`;
      if (user) {
        setMessage('Redirecting to complete setup...');
        router.replace(redirectUrl);
      } else {
        setMessage('Please sign in to continue...');
        router.replace(`/auth/sign-in?next=${encodeURIComponent(redirectUrl)}`);
      }
    };

    run().catch((e) => {
        console.error("Error processing invitation:", e);
        setError('A problem occurred while trying to process your invitation. Please try again.');
    });
  }, [router, token]);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="mb-2 text-xl font-semibold text-destructive">Invitation Error</h1>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <Button asChild>
          <Link href="/auth/sign-in">Return to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
        <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <h1 className="text-2xl font-semibold">{message}</h1>
        </div>
        <p className="mt-4 text-muted-foreground">Please wait...</p>
    </div>
  );
}
