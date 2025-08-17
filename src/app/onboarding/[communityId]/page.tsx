
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const communityId = params.communityId as string;
    const [communityName, setCommunityName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleComplete = async () => {
        if (!communityName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please enter a name for your community.'
            });
            return;
        }
        setIsLoading(true);
        try {
            const communityDocRef = doc(db, 'communities', communityId);
            await updateDoc(communityDocRef, {
                name: communityName.trim()
            });
            router.push(`/app/${communityId}`);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update community name. Please try again.'
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-lg mx-4">
                <CardHeader>
                    <CardTitle className="text-2xl">Welcome! Let's set up your community.</CardTitle>
                    <CardDescription>
                        Just a few more details to get you started.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="community-name">Community Name</Label>
                        <Input
                            id="community-name"
                            placeholder="e.g., The Igbo Union of Metro Atlanta"
                            value={communityName}
                            onChange={(e) => setCommunityName(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleComplete} className="w-full" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Complete Setup'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
