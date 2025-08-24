
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/community/app-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { SecuritySettings } from "@/components/profile/security-settings";
import { CommunityProvider } from "@/components/community/community-provider";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function ProfilePage() {
    const { user, appUser, loading } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await auth.signOut();
        router.push('/auth/sign-in');
    };
    
    // Display a loading skeleton while user data is being fetched
    if (loading || !user || !appUser) {
        return (
            <div className="min-h-screen bg-background">
                 <header className="bg-card shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-8 w-48 rounded-md" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-10 w-36 rounded-lg" />
                            <Skeleton className="h-10 w-36 rounded-lg" />
                        </div>
                        </div>
                    </div>
                </header>
                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="mb-8">
                        <Skeleton className="h-10 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-96 w-full" />
                </main>
            </div>
        )
    }

    const communityId = appUser.primaryCommunityId ?? (appUser.memberships && appUser.memberships[0]) ?? null;

  return (
    <CommunityProvider communityId={communityId}>
        <div className="min-h-screen bg-background">
            <AppHeader setActiveTab={() => {}} />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-muted-foreground">Manage your profile, avatar, and security settings.</p>
                </div>
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="avatar">Avatar</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile">
                        <ProfileForm />
                    </TabsContent>
                    <TabsContent value="avatar">
                        <AvatarUploader />
                    </TabsContent>
                    <TabsContent value="security">
                        <SecuritySettings />
                    </TabsContent>
                    <TabsContent value="account">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account</CardTitle>
                                <CardDescription>Manage account-level settings, like signing out.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Placeholder for more account settings */}
                            </CardContent>
                            <CardFooter>
                                 <Button variant="outline" onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    </CommunityProvider>
  );
}
