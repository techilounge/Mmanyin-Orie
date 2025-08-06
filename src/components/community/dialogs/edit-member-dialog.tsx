'use client';
import { useEffect } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Member } from '@/lib/types';
import { COUNTRIES } from '@/lib/countries';

const currentYear = new Date().getFullYear();
const formSchema = z.object({
  id: z.number(),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  middleName: z.string().optional(),
  yearOfBirth: z.coerce.number().int().min(1900, 'Invalid year.').max(currentYear, `Year cannot be in the future.`),
  family: z.string().min(1, 'Family is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
  phoneCountryCode: z.string().optional(),
});

type EditMemberForm = z.infer<typeof formSchema>;

interface EditMemberDialogProps {
  member: Member;
}

export function EditMemberDialog({ member }: EditMemberDialogProps) {
  const { 
    dialogState, closeDialog, updateMember, families
  } = useCommunity();

  const form = useForm<EditMemberForm>({
    resolver: zodResolver(formSchema),
  });
  
  useEffect(() => {
    if (member) {
      form.reset({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        middleName: member.middleName,
        yearOfBirth: member.yearOfBirth,
        family: member.family,
        email: member.email,
        phone: member.phone,
        phoneCountryCode: member.phoneCountryCode || '+234',
      });
    }
  }, [member, form]);
  
  if (!member) return null;

  const onSubmit = (values: EditMemberForm) => {
    const memberData: Member = { 
        ...member, 
        ...values,
        phoneCountryCode: values.phoneCountryCode || '',
    };
    updateMember(memberData);
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    closeDialog();
  };
  
  return (
    <Dialog open={dialogState?.type === 'edit-member'} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Update the details for {member.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="middleName" render={({ field }) => (
                  <FormItem><FormLabel>Middle Name <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="yearOfBirth" render={({ field }) => (
                  <FormItem><FormLabel>Year of Birth</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <Controller
                  control={form.control}
                  name="family"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Family</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a family" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {families.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField control={form.control} name="email" render={({ field }) => (
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
                              {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
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
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Update Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
