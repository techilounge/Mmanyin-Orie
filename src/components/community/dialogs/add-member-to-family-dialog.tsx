
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
import type { NewMemberData } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  middleName: z.string().trim().optional().default(''),
  tier: z.string().min(1, 'Age group is required.'),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required.'}),
  family: z.string().min(1, 'Family is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().trim().optional().default(''),
  phoneCountryCode: z.string().trim().optional().default(''),
});

const TIER_OPTIONS = [
    'Group 1 (18-24)',
    'Group 2 (25+)',
    'Under 18',
];

interface AddMemberToFamilyDialogProps {
  family: string;
}

export function AddMemberToFamilyDialog({ family }: AddMemberToFamilyDialogProps) {
  const { dialogState, closeDialog, addMember } = useCommunity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = dialogState?.type === 'add-member-to-family';
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      tier: '',
      gender: undefined,
      family: family || '',
      email: '',
      phone: '',
      phoneCountryCode: '+234',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        firstName: '',
        lastName: '',
        middleName: '',
        tier: '',
        gender: undefined,
        family: family,
        email: '',
        phone: '',
        phoneCountryCode: '+234',
      });
    }
  }, [isOpen, family, form]);

  const handleClose = () => { if(!isSubmitting) closeDialog(); };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        const memberData: NewMemberData = {
            firstName: values.firstName,
            lastName: values.lastName,
            middleName: values.middleName,
            tier: values.tier,
            family: values.family,
            gender: values.gender,
            isPatriarch: false,
            email: values.email,
            phone: values.phone,
            phoneCountryCode: values.phoneCountryCode,
        };
        await addMember(memberData);
        handleClose();
    } catch (error) {
        console.error("Failed to add member:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add the member.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Member to {family}</DialogTitle>
          <DialogDescription>
            Add a new member directly to the registry. This is for family members without an email address.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 px-6">
                <FormField name="firstName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="lastName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="middleName" control={form.control} render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Middle Name <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="tier" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Group</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an age group" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {TIER_OPTIONS.map(tier => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Email <span className="text-muted-foreground">(optional)</span></FormLabel>
                    <FormControl><Input type="email" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormItem className="md:col-span-2">
                  <FormLabel>Phone <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                     <FormField name="phoneCountryCode" control={form.control} render={({ field }) => (
                        <FormItem className="w-full">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Code" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {COUNTRY_OPTIONS.map((opt, idx) => (
                                <SelectItem key={`${opt.code}-${idx}`} value={opt.code}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                     )} />
                    <FormField name="phone" control={form.control} render={({ field }) => (
                      <FormItem className="md:col-span-2">
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
                {isSubmitting ? 'Adding...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
