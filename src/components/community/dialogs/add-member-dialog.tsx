'use client';
import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  yearOfBirth: z.coerce.number().int().min(1900, 'Invalid year.').max(currentYear, `Year cannot be in the future.`),
  family: z.string().min(1, 'Family is required.'),
  newFamilyName: z.string().optional(),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
  useCustomContribution: z.boolean(),
  customContribution: z.coerce.number().optional(),
}).refine(data => data.family !== 'new' || (data.newFamilyName && data.newFamilyName.trim().length > 0), {
  message: "New family name is required.",
  path: ["newFamilyName"],
});

export function AddMemberDialog() {
  const { 
    showAddMemberDialog, setShowAddMemberDialog, addMember, families, customContributions, 
    familyToAddTo, setFamilyToAddTo, getContribution, calculateAge,
  } = useCommunity();

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
      useCustomContribution: false,
      customContribution: 0,
    },
  });

  const useCustomContribution = form.watch('useCustomContribution');
  const yearOfBirth = form.watch('yearOfBirth');
  const familySelection = form.watch('family');

  useEffect(() => {
    if (familyToAddTo) {
      form.setValue('family', familyToAddTo);
    } else {
      form.reset();
    }
  }, [familyToAddTo, showAddMemberDialog]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const familyName = values.family === 'new' ? values.newFamilyName! : values.family;
    addMember({ ...values, family: familyName, customContribution: values.customContribution || 0 });
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    setShowAddMemberDialog(false);
    setFamilyToAddTo(null);
  };
  
  return (
    <Dialog open={showAddMemberDialog} onOpenChange={handleClose}>
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
              <div className="space-y-4">
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
                  <FormItem><FormLabel>Year of Birth</FormLabel><FormControl><Input type="number" placeholder={currentYear.toString()} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <Controller
                  control={form.control}
                  name="family"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Family</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a family" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {families.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          <SelectItem value="new">Create new family...</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {familySelection === 'new' && (
                  <FormField control={form.control} name="newFamilyName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Family Name</FormLabel>
                      <FormControl><Input placeholder="Enter new family name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <div className="border-t pt-4 space-y-4">
                  <FormField control={form.control} name="useCustomContribution" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set custom contribution amount</FormLabel>
                      </div>
                    </FormItem>
                  )} />

                  {useCustomContribution && (
                    <div className="space-y-3">
                      <FormField control={form.control} name="customContribution" render={({ field }) => (
                         <FormItem>
                          <FormLabel>Custom Amount</FormLabel>
                           <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input type="number" step="0.01" placeholder="0.00" className="pl-7" {...field} />
                            </div>
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                      )}/>
                      {customContributions.length > 0 && (
                        <div>
                          <Label className="text-sm text-muted-foreground mb-2 block">Or select a template:</Label>
                          <div className="flex flex-wrap gap-2">
                            {customContributions.map(c => (
                              <Button key={c.id} type="button" variant="secondary" size="sm" onClick={() => form.setValue('customContribution', c.amount)} title={c.description}>
                                {c.name} (${c.amount})
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {yearOfBirth && !useCustomContribution && (
                    <p className="text-sm text-muted-foreground pt-2">
                      Default contribution: ${getContribution(calculateAge(yearOfBirth))}
                    </p>
                  )}
                </div>
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
