'use client';

import { useEffect } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';

const currentYear = new Date().getFullYear();
const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  middleName: z.string().optional(),
  yearOfBirth: z.coerce.number().int().min(1900, 'Invalid year.').max(currentYear, 'Year cannot be in the future.'),
  family: z.string().min(1, 'Family is required.'),
  newFamilyName: z.string().optional(),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
}).refine(
  (data) => data.family !== 'new' || (!!data.newFamilyName && data.newFamilyName.trim().length > 0),
  { message: 'New family name is required.', path: ['newFamilyName'] }
);

export function AddMemberDialog() {
  const {
    dialogState, closeDialog, addMember, families,
  } = useCommunity();

  const isOpen = dialogState?.type === 'add-member';
  const familyToAddTo = isOpen && (dialogState as any).family ? (dialogState as any).family as string : undefined;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '', lastName: '', middleName: '',
      yearOfBirth: undefined, family: '', newFamilyName: '',
      email: '', phone: '',
    },
  });

  const familySelection = form.watch('family');

  useEffect(() => {
    if (isOpen) {
      if (familyToAddTo) form.setValue('family', familyToAddTo);
    } else {
      form.reset();
    }
  }, [isOpen, familyToAddTo, form]);

  const handleClose = () => { form.reset(); closeDialog(); };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const familyName = values.family === 'new' ? values.newFamilyName! : values.family;
    const memberData = {
        ...values,
        family: familyName,
    };
    addMember(memberData);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            {familyToAddTo ? `Adding a member to the ${familyToAddTo} family.` : 'Fill in the details to add a new member.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="firstName" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="lastName" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <FormField name="middleName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Middle Name <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField name="yearOfBirth" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Year of Birth</FormLabel><FormControl><Input type="number" placeholder={currentYear.toString()} {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <Controller name="family" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Family</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a family" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {families.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        <SelectItem value="new">Create new family...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {familySelection === 'new' && (
                  <FormField name="newFamilyName" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>New Family Name</FormLabel><FormControl><Input placeholder="Enter new family name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}

                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Email <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="phone" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Phone <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

              </div>
            </ScrollArea>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Add Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
