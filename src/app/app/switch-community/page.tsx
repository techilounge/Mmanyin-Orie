'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getApp, getApps, initializeApp,
} from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, getDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Check, Star, Info } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

type CommunityCardData = { id: string; name?: string; primaryCommunityId?: string };

export default function SwitchCommunityPage() {
  const [communities, setCommunities] = useState<CommunityCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingPrimary, setIsSettingPrimary] = useState<string | null>(null);
  const [primaryCommunityId, setPrimaryCommunityId] = useState<string | undefined>();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const { db, auth } = getFirebase();

    const run = async () => {
      setLoading(true);
      setError(null);

      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, () => resolve());
        setTimeout(() => resolve(), 500); // Give auth state a moment
        return () => unsub();
      });

      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in.');
        setLoading(false);
        return;
      }

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userDoc = userSnap.exists() ? userSnap.data() as any : {};
      const ids: string[] = Array.isArray(userDoc.memberships) ? userDoc.memberships : [];
      setPrimaryCommunityId(userDoc.primaryCommunityId);

      const out: CommunityCardData[] = [];
      for (const id of ids) {
        try {
          const cSnap = await getDoc(doc(db, 'communities', id));
          if (cSnap.exists()) {
             out.push({ id, ...(cSnap.data() as any) });
          }
        } catch (e) {
          // Gracefully ignore permission errors. This allows the page to load
          // even if a membership document is malformed. The user can use the
          // repair tool to fix it.
          console.warn(`Could not load community ${id}:`, e);
        }
      }
      setCommunities(out);
      setLoading(false);
    };

    run().catch((e) => {
      console.error(e);
      setError('Could not load your communities.');
      setLoading(false);
    });
  }, []);

  const handleSetPrimary = async (communityId: string) => {
    const { auth, db } = getFirebase();
    const user = auth.currentUser;
    if (!user) return;

    setIsSettingPrimary(communityId);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { primaryCommunityId: communityId });
      setPrimaryCommunityId(communityId);
      toast({ title: 'Primary Community Set', description: 'You will be directed here automatically next time you log in.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not set primary community.' });
    } finally {
      setIsSettingPrimary(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
     return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "url('/igbo-pattern.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 400px',
        }}
      ></div>
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center">
         <Image 
            src="/logo.png" 
            alt="Mmanyin Orie Logo" 
            width={80} 
            height={80} 
            className="rounded-2xl shadow-lg mb-6"
            priority
        />
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Select a Community</h1>
            <p className="text-muted-foreground mt-2">Choose which community you would like to manage.</p>
        </div>

        {!primaryCommunityId && communities.length > 1 && (
            <Alert className="mb-8 max-w-2xl">
                <Info className="h-4 w-4" />
                <AlertTitle>Set Your Primary Community</AlertTitle>
                <AlertDescription>
                    You belong to multiple communities. Set one as primary for a quicker login experience next time.
                </AlertDescription>
            </Alert>
        )}
        
        {communities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {communities.map(community => {
                  const isPrimary = primaryCommunityId === community.id;
                  return (
                      <Card key={community.id} className="flex flex-col hover:shadow-lg transition-shadow">
                          <CardHeader>
                              <CardTitle>{community.name}</CardTitle>
                              <CardDescription>
                                  {isPrimary ? 'Your primary community' : 'Select to view dashboard'}
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow">
                              {/* You can add more community details here if needed */}
                          </CardContent>
                          <CardFooter className="flex flex-col gap-2">
                              <Button className="w-full" asChild>
                                <Link href={`/app/${community.id}`}>Go to Dashboard</Link>
                              </Button>
                              <Button 
                                  variant="outline" 
                                  className="w-full"
                                  disabled={isPrimary || isSettingPrimary === community.id}
                                  onClick={() => handleSetPrimary(community.id)}
                              >
                                  {isSettingPrimary === community.id 
                                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                      : isPrimary ? <Check className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />
                                  }
                                  {isPrimary ? 'Primary' : 'Set as Primary'}
                              </Button>
                          </CardFooter>
                      </Card>
                  );
              })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">You are not a member of any communities yet.</p>
            <p className="text-sm mt-4">If you've accepted an invitation but don't see your community, try the <Link href="/tools/repair-memberships" className="text-primary underline">Membership Repair Tool</Link>.</p>
          </div>
        )}
      </div>
    </div>
  );
}
