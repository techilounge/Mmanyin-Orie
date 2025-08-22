
'use client';
import { useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const currentYear = new Date().getFullYear();
const formSchema = z.object({
  patriarchFirstName: z.string().min(1, "Father's first name is required."),
  patriarchLastName: z.string().min(1, 'Family name is required.'),
  yearOfBirth: z.coerce.number().int().min(1900, 'Invalid year.').max(currentYear, 'Year cannot be in the future.'),
});


export function AddFamilyDialog() {
  const { dialogState, closeDialog, addFamily } = useCommunity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { patriarchFirstName: '', patriarchLastName: '', yearOfBirth: '' as any },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const success = await addFamily(values.patriarchFirstName.trim(), values.patriarchLastName.trim(), values.yearOfBirth);
    if (success) {
      handleClose();
    }
    setIsSubmitting(false);
  };
  
  const handleClose = () => {
    form.reset();
    closeDialog();
  };

  return (
    <Dialog open={dialogState?.type === 'add-family'} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Family</DialogTitle>
          <DialogDescription>
            Enter the details for the head of the family (the father). The family will be named after him.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="patriarchFirstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Father's First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patriarchLastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Father's Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Smith" {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yearOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Father's Year of Birth</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={String(currentYear - 30)} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Family'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
