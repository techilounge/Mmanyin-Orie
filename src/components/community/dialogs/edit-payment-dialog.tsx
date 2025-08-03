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

interface EditPaymentDialogProps {
  member: Member;
  contribution: CustomContribution;
  payment: Payment;
}

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0.'),
  date: z.date({ required_error: 'Payment date is required.' }),
});

export function EditPaymentDialog({ member, contribution, payment }: EditPaymentDialogProps) {
  const { dialogState, closeDialog, updatePayment, settings, getBalanceForContribution } = useCommunity();
  const balance = getBalanceForContribution(member, contribution);
  
  // The max amount for this payment is the current balance plus the amount of the payment being edited
  const maxAmount = balance + payment.amount;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema.refine(data => data.amount <= maxAmount, {
        message: `Payment cannot exceed total due for this contribution. Max allowable: ${settings.currency}${maxAmount.toFixed(2)}`,
        path: ['amount'],
    })),
  });

  useEffect(() => {
    if (member && contribution && payment) {
      form.reset({ 
        amount: payment.amount, 
        date: new Date(payment.date) 
      });
    }
  }, [member, contribution, payment, form]);

  if (!member || !contribution || !payment) return null;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedPayment: Payment = {
        ...payment,
        amount: values.amount,
        date: values.date.toISOString(),
    }
    updatePayment(member.id, updatedPayment);
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    closeDialog();
  };

  return (
    <Dialog open={dialogState?.type === 'edit-payment'} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Payment for {member.name}</DialogTitle>
          <DialogDescription asChild>
            <div>
              <span className="font-medium text-foreground">Contribution: {contribution.name}</span>
              <br />
              Current Balance: {settings.currency}{balance.toLocaleString()}
            </div>
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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Update Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}