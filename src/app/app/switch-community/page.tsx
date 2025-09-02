
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Check, Star, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Community } from '@/lib/types';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CommunityWithDetails extends Community {
  id: string;
}

export default function SwitchCommunityPage() {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<CommunityWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingPrimary, setIsSettingPrimary] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!appUser || !appUser.memberships || appUser.memberships.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        const communityPromises = appUser.memberships.map(id => getDoc(doc(db, 'communities', id)));
        const communityDocs = await Promise.all(communityPromises);
        const fetchedCommunities = communityDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() } as CommunityWithDetails));
        
        setCommunities(fetchedCommunities);
      } catch (error) {
        console.error("Failed to fetch communities:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load your communities.' });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!loading && appUser) {
      fetchCommunities();
    }
  }, [appUser, loading, toast]);
  
  const handleSelectCommunity = (communityId: string) => {
    router.push(`/app/${communityId}`);
  };

  const handleSetPrimary = async (communityId: string) => {
    if (!user) return;
    setIsSettingPrimary(communityId);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { primaryCommunityId: communityId });
      toast({ title: 'Primary Community Set', description: 'You will be directed here automatically next time you log in.' });
      // We don't need to force a re-render as appUser will update via snapshot listener
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not set primary community.' });
    } finally {
      setIsSettingPrimary(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
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

        {!appUser?.primaryCommunityId && communities.length > 1 && (
            <Alert className="mb-8 max-w-2xl">
                <Info className="h-4 w-4" />
                <AlertTitle>Set Your Primary Community</AlertTitle>
                <AlertDescription>
                    You belong to multiple communities. Set one as primary for a quicker login experience next time.
                </AlertDescription>
            </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {communities.map(community => {
                const isPrimary = appUser?.primaryCommunityId === community.id;
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
                            <Button className="w-full" onClick={() => handleSelectCommunity(community.id)}>
                                Go to Dashboard
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
         {communities.length === 0 && (
            <p className="text-muted-foreground mt-8">You are not a member of any communities yet.</p>
        )}
      </div>
    </div>
  );
}
