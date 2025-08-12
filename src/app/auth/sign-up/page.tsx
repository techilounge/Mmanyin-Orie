
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Chrome } from 'lucide-react';


export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [communityName, setCommunityName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const createCommunityAndUser = async (user: any, name: string) => {
    const communityId = user.uid; // Use user's UID as community ID for simplicity
    
    // Create user document
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || name,
      communityId: communityId,
      role: 'Site Owner'
    });

    // Create community document
    await setDoc(doc(db, "communities", communityId), {
      ownerId: user.uid,
      name: name,
      createdAt: new Date().toISOString(),
    });
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
       toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: 'Password must be at least 6 characters long.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: communityName });
      await createCommunityAndUser(userCredential.user, communityName);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithPopup(auth, provider);
      // For Google sign-in, the community name can be derived or asked in a subsequent step.
      // For now, we'll use their display name.
      const name = userCredential.user.displayName || 'My Community';
      await createCommunityAndUser(userCredential.user, name);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign In Failed',
        description: error.message,
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>Start managing your community in minutes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSignUp} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="communityName">Community/Organization Name</Label>
            <Input id="communityName" type="text" value={communityName} onChange={(e) => setCommunityName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
         <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
          <Chrome className="mr-2 h-4 w-4" />
          {isGoogleLoading ? 'Signing Up...' : 'Sign up with Google'}
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
