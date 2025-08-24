
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, UserCredential } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Chrome } from 'lucide-react';
import { signInWithGoogle, completeGoogleRedirect, ensureUserDocument } from '@/lib/google-auth';
import { doc, getDoc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';
import type { Invitation } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AcceptInvitePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isProcessingInvite, setIsProcessingInvite] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get('token');

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setError("No invitation token provided.");
        setIsProcessingInvite(false);
        return;
      }
      try {
        const inviteRef = doc(db, 'invitations', token);
        const inviteSnap = await getDoc(inviteRef);
        if (inviteSnap.exists() && inviteSnap.data().status === 'pending') {
          const inviteData = inviteSnap.data() as Invitation;
          setInvitation(inviteData);
          setEmail(inviteData.email);
          setDisplayName(`${inviteData.firstName} ${inviteData.lastName}`);
        } else {
          setError("This invitation is invalid or has already been used.");
        }
      } catch (e) {
        setError("Failed to retrieve invitation details.");
      } finally {
        setIsProcessingInvite(false);
      }
    };
    fetchInvite();
  }, [token]);

  const processAcceptedInvite = async (user: UserCredential['user']) => {
    if (!invitation || !token) return;
    setIsProcessingInvite(true);
    try {
        const batch = writeBatch(db);

        // 1. Update the member document with the new UID and set status to active
        const memberRef = doc(db, 'communities', invitation.communityId, 'members', invitation.memberId);
        
        // Pass inviteId and inviteCode to satisfy security rules
        const memberUpdatePayload = { 
          uid: user.uid, 
          status: 'active',
          inviteId: token, // This is the invitation document ID
          inviteCode: invitation.code // This is the secret code from the invitation
        };

        batch.update(memberRef, memberUpdatePayload);

        // 2. Update the invitation to mark it as accepted
        const inviteRef = doc(db, 'invitations', token);
        batch.update(inviteRef, { status: 'accepted', acceptedByUid: user.uid, acceptedAt: new Date().toISOString() });
        
        // 3. Ensure the user document is created and add the new membership
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
             batch.update(userDocRef, {
                primaryCommunityId: invitation.communityId,
                memberships: [...(userSnap.data().memberships || []), invitation.communityId]
             });
        } else {
            // Because batch writes can't read, we have to do this outside the batch.
            // This is acceptable because ensureUserDocument is idempotent.
            await ensureUserDocument(user, {
                primaryCommunityId: invitation.communityId,
                memberships: [invitation.communityId]
            });
        }

        await batch.commit();
        router.push(`/app/${invitation.communityId}`);

    } catch (error: any) {
        console.error("Error processing invite:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to process your invitation. Please contact support.' });
        setIsProcessingInvite(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Sign Up Failed', description: 'Password must be at least 6 characters long.'});
      return;
    }
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      await processAcceptedInvite(userCredential.user);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Sign Up Failed', description: error.message });
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
        const cred = await signInWithGoogle();
        if (cred?.user) {
            await processAcceptedInvite(cred.user);
        }
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Google Sign-In failed', description: err?.message ?? 'Please try again.' });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  if (isProcessingInvite) {
      return (
        <Card className="w-full">
            <CardHeader><CardTitle>Verifying Invitation...</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
      );
  }

  if (error) {
      return (
         <Card className="w-full text-center">
            <CardHeader>
                <CardTitle className="text-destructive">Invitation Error</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
             <CardFooter>
                 <Button asChild className="w-full"><Link href="/auth/sign-in">Return to Sign In</Link></Button>
             </CardFooter>
        </Card>
      );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Accept Your Invitation</CardTitle>
        <CardDescription>Create an account to join {invitation?.communityName}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSignUp} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="displayName">Your Name</Label>
            <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isProcessingInvite}>
            {isLoading ? 'Creating Account...' : 'Create Account & Join'}
          </Button>
        </form>
         <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isProcessingInvite}>
          <Chrome className="mr-2 h-4 w-4" />
          {isGoogleLoading ? 'Signing In...' : 'Join with Google'}
        </Button>
      </CardContent>
       <CardFooter className="justify-center text-sm">
        <p>Already have an account? <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">Sign in</Link></p>
      </CardFooter>
    </Card>
  );
}
