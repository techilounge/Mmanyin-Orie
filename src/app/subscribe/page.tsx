
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
    {
        name: "Community Plan",
        price: "$49",
        priceId: "price_123abc", // Replace with your Stripe Price ID
        features: [
            "Up to 500 members",
            "Full access to all features",
            "Email support",
            "Community onboarding",
        ]
    }
]

export default function SubscribePage() {

    const handleSubscribe = async (priceId: string) => {
        // TODO: Implement Stripe Checkout
        alert(`Subscribing to ${priceId}`);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">Choose Your Plan</h1>
                <p className="text-muted-foreground mt-2">
                    You're one step away from managing your community like a pro.
                </p>
            </div>
             <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{plans[0].name}</CardTitle>
                    <CardDescription>
                        <span className="text-4xl font-bold">{plans[0].price}</span>
                        <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {plans[0].features.map(feature => (
                            <li key={feature} className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-500" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => handleSubscribe(plans[0].priceId)}>
                        Subscribe Now
                    </Button>
                </CardFooter>
             </Card>
        </div>
    );
}
