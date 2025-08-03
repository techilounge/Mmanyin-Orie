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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { CustomContribution } from '@/lib/types';

interface EditCustomContributionDialogProps {
  contribution: CustomContribution;
}

const formSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Template name is required.'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  description: z.string().optional(),
});

type EditCustomContributionForm = z.infer<typeof formSchema>;

export function EditCustomContributionDialog({ contribution }: EditCustomContributionDialogProps) {
  const { dialogState, closeDialog, updateCustomContribution, settings } = useCommunity();
  
  const form = useForm<EditCustomContributionForm>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (contribution) {
      form.reset({
        id: contribution.id,
        name: contribution.name,
        amount: contribution.amount,
        description: contribution.description,
      });
    }
  }, [contribution, form]);

  if (!contribution) return null;

  const onSubmit = (values: EditCustomContributionForm) => {
    updateCustomContribution(values);
    handleClose();
  };
  
  const handleClose = () => {
    form.reset();
    closeDialog();
  }

  return (
    <Dialog open={dialogState?.type === 'edit-custom-contribution'} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Custom Contribution Template</DialogTitle>
          <DialogDescription>
            Update the details for the "{contribution.name}" template.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Student Discount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings.currency}</span>
                      <Input type="number" step="0.01" placeholder="0.00" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe when to use this template" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Update Template</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
