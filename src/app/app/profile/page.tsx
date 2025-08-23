
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/community/app-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";

export default function ProfilePage() {
    const { user, appUser, loading } = useAuth();

    if (loading || !user || !appUser) {
        return (
            <div className="p-8">
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

  return (
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
                     <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Manage your password and account security.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <p>Security settings will go here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="account">
                     <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                            <CardDescription>Manage account-level settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p>Account settings will go here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    </div>
  );
}
