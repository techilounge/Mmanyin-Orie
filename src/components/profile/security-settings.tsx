
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth';
import { auth, db, storage } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
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

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function SecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

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

  async function handleDeleteAccount() {
    if (!user) return;

    setIsDeleteSubmitting(true);
    try {
      // 1. Delete user from Firebase Auth
      await deleteUser(user);

      // 2. Delete user document from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);

      // 3. Delete user avatar from Storage (if it exists)
      const avatarRef = ref(storage, `avatars/${user.uid}/profile.png`);
      try {
        await deleteObject(avatarRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.warn("Could not delete avatar, but proceeding with account deletion:", error);
        }
      }
      
      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      router.push('/');

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Please sign out and sign back in, then try again.' });
    } finally {
        setIsDeleteSubmitting(false);
    }
  }


  return (
    <div className="space-y-8">
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
    </div>
  );
}
