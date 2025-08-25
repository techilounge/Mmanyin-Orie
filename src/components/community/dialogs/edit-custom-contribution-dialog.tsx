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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { CustomContribution, Settings } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface EditCustomContributionDialogProps {
  contribution: CustomContribution;
}

const TIERS = (settings: Settings): string[] => [
  `Group 1 (${settings.tier1Age}-${settings.tier2Age - 1})`,
  `Group 2 (${settings.tier2Age}+)`,
  'Under 18',
];

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required.'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  description: z.string().optional(),
  tiers: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one age group.",
  }),
  frequency: z.enum(['one-time', 'monthly'], {
    required_error: "You need to select a frequency.",
  }),
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
        tiers: contribution.tiers || [],
        frequency: contribution.frequency || 'one-time',
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
  
  const tierOptions = TIERS(settings);

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
              name="frequency"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Frequency</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="one-time" />
                        </FormControl>
                        <FormLabel className="font-normal">One-time</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="monthly" />
                        </FormControl>
                        <FormLabel className="font-normal">Monthly</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tiers"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Applicable Age Groups</FormLabel>
                  </div>
                  {tierOptions.map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="tiers"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
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
