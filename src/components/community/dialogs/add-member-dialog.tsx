
'use client';

import { useEffect, useState } from 'react';
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
import { COUNTRY_OPTIONS } from '@/lib/countries';
import { NewMemberData } from '@/lib/types';

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
  phoneCountryCode: z.string().optional(),
}).refine(
  (data) => data.family !== 'new' || (!!data.newFamilyName && data.newFamilyName.trim().length > 0),
  { message: 'New family name is required.', path: ['newFamilyName'] }
);

export function AddMemberDialog() {
  const {
    dialogState, closeDialog, addMember, families, addFamily
  } = useCommunity();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = dialogState?.type === 'add-member';
  const familyToAddTo = isOpen && (dialogState as any).family ? (dialogState as any).family as string : undefined;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '', lastName: '', middleName: '',
      yearOfBirth: undefined,
      family: '', newFamilyName: '',
      email: '', phone: '', phoneCountryCode: '+234',
    },
  });

  const familySelection = form.watch('family');

  useEffect(() => {
    if (isOpen) {
      form.reset({
        firstName: '', lastName: '', middleName: '',
        yearOfBirth: undefined,
        family: familyToAddTo || '', newFamilyName: '',
        email: '', phone: '', phoneCountryCode: '+234',
      });
    } else {
      setIsSubmitting(false);
    }
  }, [isOpen, familyToAddTo, form]);

  const handleClose = () => { if(!isSubmitting) closeDialog(); };

  const onSubmit = async (values: z.infer<typeof formSchema>>) => {
    setIsSubmitting(true);
    try {
        let familyNameToUse = values.family;
        if (values.family === 'new' && values.newFamilyName) {
            const newFamilyNameTrimmed = values.newFamilyName.trim();
            const success = await addFamily(newFamilyNameTrimmed);
            if (success) {
                familyNameToUse = newFamilyNameTrimmed;
            } else {
                setIsSubmitting(false);
                return; // Stop if family creation failed
            }
        }
        
        const memberData: NewMemberData = {
            firstName: values.firstName,
            lastName: values.lastName,
            middleName: values.middleName,
            yearOfBirth: values.yearOfBirth,
            family: familyNameToUse,
            email: values.email,
            phone: values.phone,
            phoneCountryCode: values.phoneCountryCode || '',
        };
        
        const memberSuccess = await addMember(memberData);
        if(memberSuccess) {
            handleClose();
        }
    } catch (error) {
        console.error("Failed to add member:", error);
    } finally {
        setIsSubmitting(false);
    }
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
                  <FormItem><FormLabel>Year of Birth</FormLabel><FormControl><Input type="number" placeholder={currentYear.toString()} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />

                <Controller name="family" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Family</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!!familyToAddTo}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a family" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {families.sort((a,b) => a.name.localeCompare(b.name)).map((f) => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                        <SelectItem value="new">Create new family...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {familySelection === 'new' && !familyToAddTo && (
                  <FormField name="newFamilyName" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>New Family Name</FormLabel><FormControl><Input placeholder="Enter new family name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}

                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Email <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <FormItem>
                  <FormLabel>Phone <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <div className="flex gap-2">
                     <FormField name="phoneCountryCode" control={form.control} render={({ field }) => (
                        <FormItem className="w-1/3">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Code" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRY_OPTIONS.map((opt, idx) => (
                                <SelectItem key={`${opt.code}-${idx}`} value={opt.code}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                     )} />
                    <FormField name="phone" control={form.control} render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl><Input type="tel" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </FormItem>

              </div>
            </ScrollArea>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding Member...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
