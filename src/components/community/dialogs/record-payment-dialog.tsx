'use client';
import { useEffect } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Member, Payment, CustomContribution } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecordPaymentDialogProps {
  member: Member;
  contribution: CustomContribution;
}

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0.'),
  date: z.date({ required_error: 'Payment date is required.' }),
});

export function RecordPaymentDialog({ member, contribution }: RecordPaymentDialogProps) {
  const { dialogState, closeDialog, recordPayment, settings, getBalanceForContribution, getPaidAmountForContribution } = useCommunity();
  const balance = getBalanceForContribution(member, contribution);
  const paidAmount = getPaidAmountForContribution(member, contribution.id);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema.refine(data => data.amount <= balance, {
        message: `Payment cannot exceed balance of ${settings.currency}${balance}.`,
        path: ['amount'],
    })),
    defaultValues: {
      amount: balance > 0 ? balance : 0,
      date: new Date(),
    },
  });

  useEffect(() => {
    if (member && contribution) {
      const newBalance = getBalanceForContribution(member, contribution);
      form.reset({ amount: newBalance > 0 ? newBalance : 0, date: new Date() });
    }
  }, [member, contribution, form, getBalanceForContribution]);

  if (!member || !contribution) return null;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    recordPayment(member.id, contribution.id, {
      amount: values.amount,
      date: values.date.toISOString(),
    });
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    closeDialog();
  };
  
  const paymentsForThisContribution = member.payments.filter(p => p.contributionId === contribution.id);

  return (
    <Dialog open={dialogState?.type === 'record-payment'} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment for {member.name}</DialogTitle>
          <DialogDescription>
            <p className="font-medium text-foreground">Contribution: {contribution.name}</p>
            Total Due: {settings.currency}{contribution.amount} |
            Paid: {settings.currency}{paidAmount} |
            Balance: {settings.currency}{balance}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentsForThisContribution.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium">Payment History for {contribution.name}</h4>
                    <ScrollArea className="h-24 pr-4">
                        <div className="space-y-2 text-sm">
                            {paymentsForThisContribution.map((p: Payment) => (
                                <div key={p.id} className="flex justify-between items-center text-muted-foreground">
                                    <span>{settings.currency}{p.amount.toLocaleString()}</span>
                                    <span>{format(new Date(p.date), "PPP")}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
