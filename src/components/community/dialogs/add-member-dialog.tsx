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
import { COUNTRIES } from '@/lib/countries';
import { NewMemberData } from '@/lib/types';

// Build unique options by dial code, merging names that share a code.
// Example: "+1" => "United States / Canada (+1)"
const COUNTRY_OPTIONS = (() => {
  const byCode = new Map<string, string[]>();
  for (const c of COUNTRIES) {
    const code = String(c.code).trim();
    const name = (c.name ?? '').trim();
    if (!byCode.has(code)) byCode.set(code, []);
    const list = byCode.get(code)!;
    if (name && !list.includes(name)) list.push(name);
  }
  return Array.from(byCode.entries()).map(([code, names]) => ({
    code,
    label: `${names.join(' / ')} (${code})`,
  }));
})();

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
    dialogState, closeDialog, addMember, families,
  } = useCommunity();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = dialogState?.type === 'add-member';
  const familyToAddTo = isOpen && (dialogState as any).family ? (dialogState as any).family as string : undefined;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '', lastName: '', middleName: '',
      yearOfBirth: '' as any, // Initialize with empty string to avoid uncontrolled component error
      family: '', newFamilyName: '',
      email: '', phone: '', phoneCountryCode: '+234',
    },
  });

  const familySelection = form.watch('family');

  useEffect(() => {
    if (isOpen) {
      if (familyToAddTo) form.setValue('family', familyToAddTo);
    } else {
      form.reset({
        firstName: '', lastName: '', middleName: '',
        yearOfBirth: '' as any,
        family: '', newFamilyName: '',
        email: '', phone: '', phoneCountryCode: '+234',
      });
      setIsSubmitting(false);
    }
  }, [isOpen, familyToAddTo, form]);

  const handleClose = () => { if(!isSubmitting) closeDialog(); };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        const familyName = values.family === 'new' ? values.newFamilyName!.trim() : values.family;
        const memberData: NewMemberData = {
            ...values,
            family: familyName,
            phoneCountryCode: values.phoneCountryCode || '',
        };
        await addMember(memberData);
        closeDialog(); // This will also trigger the useEffect to reset the form
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
                  <FormItem><FormLabel>Year of Birth</FormLabel><FormControl><Input type="number" placeholder={currentYear.toString()} {...field} /></FormControl><FormMessage /></FormItem>
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

                {familySelection === 'new' && (
                  <FormField name="newFamilyName" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>New Family Name</FormLabel><FormControl><Input placeholder="Enter new family name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}

                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Email <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
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
                        <FormControl><Input type="tel" {...field} /></FormControl>
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
