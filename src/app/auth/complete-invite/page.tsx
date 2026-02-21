
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { acceptInvitationAction } from '@/lib/invite-actions';

export default function CompleteInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [message, setMessage] = useState('Completing your invitation…');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

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

      // Call the secure Server Action
      const result = await acceptInvitationAction(token, user.uid, user.email || '', user.displayName || '');

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage('Invitation accepted. Redirecting…');
      router.replace(`/app/${result.communityId}`);
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
