
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth';
import { auth, db, storage } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser, updateEmail } from 'firebase/auth';
import { doc, deleteDoc, writeBatch, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import type { AppUser, Member } from '@/lib/types';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const emailFormSchema = z.object({
    newEmail: z.string().email({ message: "Please enter a valid email address." }),
    currentPassword: z.string().min(1, { message: "Password is required to change email." }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;


export function SecuritySettings() {
  const { user, appUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [canDeleteAccount, setCanDeleteAccount] = useState(false);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { newEmail: user?.email || '', currentPassword: '' },
  });


  useEffect(() => {
    const checkUserRole = async () => {
      if (appUser && appUser.memberships && appUser.memberships.length > 0) {
        for (const communityId of appUser.memberships) {
           const memberDocRef = doc(db, 'communities', communityId, 'members', appUser.uid);
           const memberDocSnap = await getDoc(memberDocRef);
           if (memberDocSnap.exists()) {
               const memberData = memberDocSnap.data() as Member;
               if (memberData.role === 'admin' || memberData.role === 'owner') {
                   setCanDeleteAccount(true);
                   return; // Found a privileged role, no need to check further
               }
           }
        }
      }
      setCanDeleteAccount(false); // No privileged role found
    };
    checkUserRole();
  }, [appUser]);

  async function onPasswordSubmit(data: PasswordFormValues) {
    if (!user || !user.email) return;

    setIsPasswordSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);

      toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.code === 'auth/wrong-password' ? 'The current password you entered is incorrect.' : 'Failed to update password. Please try again.',
      });
    } finally {
      setIsPasswordSubmitting(false);
    }
  }
  
  async function onEmailSubmit(data: EmailFormValues) {
    if (!user || !user.email) return;

    setIsEmailSubmitting(true);
    try {
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        await updateEmail(user, data.newEmail);

        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { email: data.newEmail });
        
        // Also update the email in all member documents
        if (appUser?.memberships) {
            const batch = writeBatch(db);
            appUser.memberships.forEach(communityId => {
                const memberDocRef = doc(db, 'communities', communityId, 'members', user.uid);
                batch.update(memberDocRef, { email: data.newEmail });
            });
            await batch.commit();
        }

        toast({ title: 'Email Updated', description: 'Your email has been changed successfully.' });
        emailForm.reset({ newEmail: data.newEmail, currentPassword: '' });
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: error.code === 'auth/wrong-password' 
                ? 'The password you entered is incorrect.' 
                : 'Failed to update email. Please try again.',
        });
    } finally {
        setIsEmailSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;

    setIsDeleteSubmitting(true);
    try {
      // 1. Get the list of memberships from the user's document
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const appUserData = userDocSnap.data() as AppUser;
      const communityIds = appUserData?.memberships || [];

      // 2. Prepare a batch to delete all associated membership documents and the main user doc
      const batch = writeBatch(db);
      communityIds.forEach(communityId => {
        const memberDocRef = doc(db, 'communities', communityId, 'members', user.uid);
        batch.delete(memberDocRef);
      });
      batch.delete(userDocRef);
      
      // 3. Commit the batch deletion from Firestore
      await batch.commit();
      
      // 4. Delete user avatar from Storage (if it exists)
      const avatarRef = ref(storage, `avatars/${user.uid}/profile.png`);
      try {
        await deleteObject(avatarRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.warn("Could not delete avatar, but proceeding with account deletion:", error);
        }
      }
      
      // 5. Delete user from Firebase Auth (this should be last)
      await deleteUser(user);
      
      toast({ title: 'Account Deleted', description: 'Your account and all associated data have been permanently deleted.' });
      router.push('/');

    } catch (error: any) {
        console.error("Account deletion error:", error);
        toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Please sign out and sign back in, then try again.' });
    } finally {
        setIsDeleteSubmitting(false);
    }
  }


  return (
    <div className="space-y-8">
       <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Change Email</CardTitle>
              <CardDescription>Update the email address associated with your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={emailForm.control} name="newEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Email Address</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={emailForm.control} name="currentPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password (for security)</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isEmailSubmitting}>
                {isEmailSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Email
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    
      <Form {...passwordForm}>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>For your security, we recommend using a strong password that you don't use elsewhere.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPasswordSubmitting}>
                {isPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {canDeleteAccount && (
        <Card className="border-destructive">
            <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle />Delete Account</CardTitle>
            <CardDescription>Permanently delete your account and all of your content. This action is not reversible.</CardDescription>
            </CardHeader>
            <CardFooter>
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers. Please type <strong className="text-foreground">DELETE</strong> to confirm.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className="my-2"
                    />
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== 'DELETE' || isDeleteSubmitting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete my account
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
