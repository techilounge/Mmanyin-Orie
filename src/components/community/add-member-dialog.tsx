
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Copy, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TIER_OPTIONS = [
    'Group 1 (18-24)',
    'Group 2 (25+)',
    'Under 18',
];

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  middleName: z.string().trim().optional().default(''),
  tier: z.string().min(1, 'Age group is required.'),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required.'}),
  family: z.string().min(1, 'Family is required.'),
  newFamilyName: z.string().optional(),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().trim().optional().default(''),
  phoneCountryCode: z.string().trim().optional().default(''),
}).refine(
  (data) => data.family !== 'new', // "new" family creation is deprecated from this dialog
  { message: 'Please create families from the Families tab.', path: ['family'] }
);

export function AddMemberDialog() {
  const {
    dialogState, closeDialog, inviteMember, addMember, families
  } = useCommunity();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  // Valid dialog types per DialogState: 'invite-member' | 'add-member-to-family' | ...
  const isInvite = dialogState?.type === 'invite-member';
  const isAddToFamily = dialogState?.type === 'add-member-to-family';
  
  // Open if either of the valid "add member" flows is active.
  const isOpen = Boolean(isInvite || isAddToFamily);
  
  // Family is only present when adding directly to a family.
  const familyToAddTo = isAddToFamily ? (dialogState as any).family as string : undefined;
  
  // Determine if this form should invite or add directly.
  // We can base this on whether an email is provided.
  const [isInviteFlow, setIsInviteFlow] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      tier: '',
      gender: undefined,
      family: '',
      newFamilyName: '',
      email: '',
      phone: '',
      phoneCountryCode: '+234',
    },
  });

  const emailValue = form.watch('email');

  useEffect(() => {
      // If email is provided, it's an invite flow.
      setIsInviteFlow(!!emailValue);
  }, [emailValue]);


  useEffect(() => {
    if (isOpen) {
      const familyName = familyToAddTo || '';
      // The family name is "FirstName LastName", so we extract the last name.
      const lastName = familyName.split(' ').slice(1).join(' ');
      
      form.reset({
        firstName: '',
        lastName: '',
        middleName: '',
        tier: '',
        gender: undefined,
        family: familyToAddTo || '', newFamilyName: '',
        email: '',
        phone: '',
        phoneCountryCode: '+234',
      });
      setInviteLink(null);
      setHasCopied(false);
    } else {
      setIsSubmitting(false);
    }
  }, [isOpen, familyToAddTo, form]);

  const handleClose = () => { 
    if(!isSubmitting) {
      setInviteLink(null);
      closeDialog(); 
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        const memberData: NewMemberData = {
            firstName: values.firstName,
            lastName: values.lastName,
            middleName: values.middleName ?? '',
            tier: values.tier,
            family: values.family,
            gender: values.gender,
            isPatriarch: false, // Only family head can be patriarch
            email: values.email ?? '',
            phone: values.phone ?? '',
            phoneCountryCode: values.phoneCountryCode ?? '',
        };

        if (isInviteFlow) {
          if (!values.email) {
            toast({ variant: 'destructive', title: 'Email Required', description: 'Please provide an email to send an invitation.' });
            setIsSubmitting(false);
            return;
          }
          const success = await inviteMember(memberData);
          if(success) {
              setInviteLink(`${window.location.origin}/auth/accept-invite?token=...`); // Using a placeholder link for UI feedback
          }
        } else {
          await addMember(memberData);
          closeDialog();
        }

    } catch (error) {
        console.error("Failed to process member:", error);
    } finally {
        // Only set submitting to false if we are not in the invite link success state
        if (!inviteLink) {
           setIsSubmitting(false);
        }
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
        navigator.clipboard.writeText(inviteLink);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    }
  };
  
  const dialogTitle = isInviteFlow ? 'Invite New Member' : 'Add New Member';
  const dialogDescription = isInviteFlow 
    ? 'An invitation link will be generated to share with the new member.'
    : 'Add a new member directly to the registry. This is useful for family members without an email.';
  const buttonText = isInviteFlow ? 'Generate Invite' : 'Add Member';


  if (inviteLink) {
    return (
       <Dialog open={!!inviteLink} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl md:max-w-2xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><PartyPopper className="text-primary"/>Invitation Sent!</DialogTitle>
                <DialogDescription>
                    An invitation email has been sent. You can also copy the link below and share it directly.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-start gap-2 pt-4">
                <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    )
  }

  return (
    <Dialog open={isOpen && !inviteLink} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {familyToAddTo ? `Adding a member to the ${familyToAddTo} family.` : dialogDescription}
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

                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                
                <Controller name="family" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Family</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!!familyToAddTo}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a family" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {families.sort((a,b) => a.name.localeCompare(b.name)).map((f) => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-muted-foreground">(optional, for invites)</span></FormLabel>
                    <FormControl><Input type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage />
                  </FormItem>
                )} />

                <FormItem className="md:col-span-2">
                  <FormLabel>Phone <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                     <FormField name="phoneCountryCode" control={form.control} render={({ field }) => (
                        <FormItem className="w-full">
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
                {isSubmitting ? 'Saving...' : buttonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
