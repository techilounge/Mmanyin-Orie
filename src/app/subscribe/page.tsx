
'use client';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const plans = [
    {
        name: "Free Tier",
        price: "$0",
        priceId: "free",
        features: [
            "Up to 50 members",
            "Full access to all features",
            "Community support",
        ],
        cta: "Get Started"
    },
    {
        name: "Community Plan",
        price: "$49",
        priceId: "price_123abc", // Replace with your Stripe Price ID
        features: [
            "Up to 500 members",
            "Full access to all features",
            "Email support",
            "Community onboarding",
        ],
        cta: "Subscribe Now"
    }
]

export default function SubscribePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isChecking, setIsChecking] = useState(false);

    const handleSelectPlan = async (priceId: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be signed in.' });
            return;
        }

        if (priceId === 'free') {
            setIsChecking(true);
            try {
                // Check if user already owns a community to prevent re-entry to this flow
                const q = query(collection(db, 'communities'), where('ownerUid', '==', user.uid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    toast({ title: 'Community Found', description: 'Redirecting you to your existing community.' });
                    const communityId = querySnapshot.docs[0].id;
                    router.push(`/app/${communityId}`);
                    return;
                }
                
                // Redirect to the dedicated creation page instead of creating here
                router.push('/create-community');

            } catch (error: any) {
                console.error("Failed to check for community:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not proceed. Please try again.' });
            } finally {
                setIsChecking(false);
            }

        } else {
            // TODO: Implement Stripe Checkout
            alert(`Subscribing to ${priceId}`);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">Choose Your Plan</h1>
                <p className="text-muted-foreground mt-2">
                    You're one step away from managing your community like a pro.
                </p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {plans.map((plan) => (
                    <Card key={plan.name} className={`flex flex-col ${plan.name === 'Community Plan' ? 'border-primary shadow-lg' : ''}`}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>
                                <span className="text-4xl font-bold">{plan.price}</span>
                                {plan.price !== '$0' && <span className="text-muted-foreground">/month</span>}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ul className="space-y-3">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full" 
                                onClick={() => handleSelectPlan(plan.priceId as 'free' | 'community')}
                                disabled={isChecking && plan.priceId === 'free'}
                                variant={plan.name === 'Community Plan' ? 'default' : 'outline'}
                            >
                                {isChecking && plan.priceId === 'free' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Please wait...
                                    </>
                                ) : plan.cta}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
             </div>
        </div>
    );
}
