'use client';
import { useCommunity } from '@/hooks/use-community';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function AddFamilyDialog() {
  const { dialogState, closeDialog, addFamily, families } = useCommunity();

  const formSchema = z.object({
    familyName: z.string()
      .min(1, 'Family name is required.')
      .refine(name => !families.some(f => f.name === name.trim()), {
        message: 'This family name already exists.',
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { familyName: '' },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addFamily(values.familyName.trim());
    handleClose();
  };
  
  const handleClose = () => {
    form.reset();
    closeDialog();
  };

  return (
    <Dialog open={dialogState?.type === 'add-family'} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Family</DialogTitle>
          <DialogDescription>
            Enter the last name for the new family.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="familyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Family Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Smith" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Create Family</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
