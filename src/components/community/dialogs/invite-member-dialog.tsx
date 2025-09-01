
'use client';

import { useEffect, useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COUNTRY_OPTIONS } from '@/lib/countries';
import type { NewMemberData } from '@/lib/types';
import { CheckCircle } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  middleName: z.string().trim().optional().default(''),
  tier: z.string().min(1, 'Age group is required.'),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required.'}),
  family: z.string().min(1, 'Family is required.'),
  newFamilyName: z.string().optional(),
  email: z.string().email('Invalid email address.'),
  phone: z.string().trim().optional().default(''),
  phoneCountryCode: z.string().trim().optional().default(''),
}).refine(data => {
    if (data.family === 'new') {
        return !!data.newFamilyName && data.newFamilyName.trim().length > 0;
    }
    return true;
}, {
    message: "New family name is required.",
    path: ["newFamilyName"],
});

const TIER_OPTIONS = [
    'Group 1 (18-24)',
    'Group 2 (25+)',
    'Under 18',
];

export function InviteMemberDialog() {
  const {
    dialogState, closeDialog, inviteMember, families
  } = useCommunity();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const isOpen = dialogState?.type === 'invite-member';
  const familyToAddTo = isOpen && (dialogState as any).family ? (dialogState as any).family as string : undefined;
  
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

  const familyValue = form.watch('family');

  const handleClose = () => {
    if(!isSubmitting) {
      form.reset();
      setInviteSent(false);
      closeDialog();
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        firstName: '',
        lastName: '',
        middleName: '',
        tier: '',
        gender: undefined,
        family: familyToAddTo || '',
        newFamilyName: '',
        email: '',
        phone: '',
        phoneCountryCode: '+234',
      });
      setInviteSent(false);
    } else {
      setIsSubmitting(false);
    }
  }, [isOpen, familyToAddTo, form]);

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
        
        const newFamilyName = values.family === 'new' ? values.newFamilyName : undefined;
        const success = await inviteMember(memberData, newFamilyName);
        if(success) {
            setInviteSent(true);
        } else {
          setIsSubmitting(false);
        }

    } catch (error) {
        console.error("Failed to process member:", error);
        setIsSubmitting(false);
    }
  };
  
  if (inviteSent) {
    return (
       <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
            <DialogHeader className="text-center items-center">
                <CheckCircle className="text-green-500 h-16 w-16 mb-4" />
                <DialogTitle className="text-2xl">Invitation Sent!</DialogTitle>
                <DialogDescription>
                    An invitation email has been successfully sent. The recipient can now join your community.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
                <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite New Member</DialogTitle>
          <DialogDescription>
             An invitation email will be sent to the new member.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] -mx-6">
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
                
                <FormField control={form.control} name="family" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Family</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!!familyToAddTo}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a family" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {families.sort((a,b) => a.name.localeCompare(b.name)).map((f) => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                        <SelectItem value="new" className="font-bold text-primary">Create new family...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                
                {familyValue === 'new' && (
                    <FormField
                        control={form.control}
                        name="newFamilyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Family Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter family name" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem className={familyValue === 'new' ? '' : 'md:col-span-2'}>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="Email is required for an invite" {...field} value={field.value ?? ''} /></FormControl><FormMessage />
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
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
