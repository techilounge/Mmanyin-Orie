
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

const currentYear = new Date().getFullYear();
const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  middleName: z.string().trim().optional().default(''),
  yearOfBirth: z.coerce.number().int().min(1900, 'Invalid year.').max(currentYear, 'Year cannot be in the future.'),
  family: z.string().min(1, 'Family is required.'),
  newFamilyName: z.string().optional(),
  email: z.string().email('A valid email is required to send an invitation.'),
  phone: z.string().trim().optional().default(''),
  phoneCountryCode: z.string().trim().optional().default(''),
}).refine(
  (data) => data.family !== 'new', // "new" family creation is deprecated from this dialog
  { message: 'Please create families from the Families tab.', path: ['family'] }
);

export function AddMemberDialog() {
  const {
    dialogState, closeDialog, inviteMember, families, addFamily
  } = useCommunity();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);


  const isOpen = dialogState?.type === 'add-member';
  const familyToAddTo = isOpen && (dialogState as any).family ? (dialogState as any).family as string : undefined;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      yearOfBirth: undefined,
      family: '',
      newFamilyName: '',
      email: '',
      phone: '',
      phoneCountryCode: '+234',
    },
  });

  useEffect(() => {
    if (isOpen) {
      const familyName = familyToAddTo || '';
      const familyDetails = families.find(f => f.name === familyName);
      form.reset({
        firstName: '',
        lastName: '',
        middleName: '',
        yearOfBirth: undefined,
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
  }, [isOpen, familyToAddTo, form, families]);

  const handleClose = () => { if(!isSubmitting) closeDialog(); };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        const memberData: NewMemberData = {
            firstName: values.firstName,
            lastName: values.lastName,
            middleName: values.middleName,
            yearOfBirth: values.yearOfBirth,
            family: values.family,
            gender: values.gender,
            isPatriarch: false, // Only family head can be patriarch
            email: values.email,
            phone: values.phone,
            phoneCountryCode: values.phoneCountryCode,
        };
        
        const link = await inviteMember(memberData);
        if(link) {
            setInviteLink(link);
        }
    } catch (error) {
        console.error("Failed to invite member:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
        navigator.clipboard.writeText(inviteLink);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    }
  };

  if (inviteLink) {
    return (
       <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><PartyPopper className="text-primary"/>Invitation Sent!</DialogTitle>
                <DialogDescription>
                    The invitation is ready. Copy the link below and share it with the new member.
                </DialogDescription>
            </DialogHeader>
            <Alert>
                <AlertTitle>Shareable Invite Link</AlertTitle>
                <AlertDescription className="break-all text-primary">
                    {inviteLink}
                </AlertDescription>
            </Alert>
            <DialogFooter className="sm:justify-between gap-2">
                <Button variant="outline" onClick={handleClose}>Done</Button>
                <Button onClick={copyToClipboard}>
                    {hasCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {hasCopied ? 'Copied!' : 'Copy Link'}
                </Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New Member</DialogTitle>
          <DialogDescription>
            {familyToAddTo ? `Inviting a member to the ${familyToAddTo} family.` : 'Fill in the details to invite a new member.'}
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
                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} readOnly={!!familyToAddTo} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <FormField name="middleName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Middle Name <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField name="yearOfBirth" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Year of Birth</FormLabel><FormControl><Input type="number" placeholder={String(currentYear)} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />

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
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
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
                {isSubmitting ? 'Sending Invite...' : 'Invite Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
