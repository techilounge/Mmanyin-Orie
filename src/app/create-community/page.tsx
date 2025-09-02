'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function CreateCommunityPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [communityName, setCommunityName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateCommunity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be signed in.' });
            return;
        }
        if (!communityName.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please enter a name for your community.'});
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create the community document
            const communityRef = await addDoc(collection(db, 'communities'), {
                name: communityName.trim(),
                slug: `${user.uid}-community`,
                ownerUid: user.uid,
                createdBy: user.uid,
                timezone: 'America/New_York',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                subscription: {
                    status: 'trialing',
                    planId: 'free',
                    stripeCustomerId: null,
                    stripeSubId: null,
                    currentPeriodEnd: null,
                },
            });

            // 2. Create the owner's membership document
            const memberRef = doc(db, 'communities', communityRef.id, 'members', user.uid);
            await setDoc(memberRef, {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                role: 'owner',
                status: 'active',
                joinDate: new Date().toISOString(),
            });

            // 3. Update the user's document with the new membership
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                memberships: arrayUnion(communityRef.id)
            });
            
            // 4. Redirect to the new community app
            router.push(`/app/${communityRef.id}`);

        } catch (error: any) {
            console.error("Failed to create community:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create your community. Please try again.' });
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background">
            <div 
                className="absolute inset-0 z-0 opacity-20"
                style={{
                backgroundImage: "url('/igbo-pattern.svg')",
                backgroundRepeat: 'repeat',
                backgroundSize: '400px 400px',
                }}
            ></div>
            <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
                <Image 
                    src="/logo.png" 
                    alt="Mmanyin Orie Logo" 
                    width={80} 
                    height={80} 
                    className="rounded-2xl shadow-lg mb-6"
                    priority
                />
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl">Name Your Community</CardTitle>
                        <CardDescription>
                            This will be the official name for your kindred association.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateCommunity} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="community-name">Community Name</Label>
                                <Input
                                    id="community-name"
                                    placeholder="e.g., The Igbo Union of Metro Atlanta"
                                    value={communityName}
                                    onChange={(e) => setCommunityName(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : 'Create Community & Continue'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
