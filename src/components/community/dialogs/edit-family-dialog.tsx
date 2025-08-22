
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Family } from '@/lib/types';

interface EditFamilyDialogProps {
  family: Family;
}

export function EditFamilyDialog({ family }: EditFamilyDialogProps) {
  const { dialogState, closeDialog, updateFamily, families } = useCommunity();

  const formSchema = z.object({
    familyName: z.string()
      .min(1, 'Family name is required.'),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { familyName: family?.name || '' },
  });

  useEffect(() => {
    if (family) {
      form.setValue('familyName', family.name);
    }
  }, [family, form]);

  if (!family) return null;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFamily(family, values.familyName.trim());
    handleClose();
  };
  
  const handleClose = () => {
    form.reset();
    closeDialog();
  };

  return (
    <Dialog open={dialogState?.type === 'edit-family'} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Family Name</DialogTitle>
          <DialogDescription>
            The family name is based on the father's name. To change it, please edit the details of the family head.
          </DialogDescription>
        </DialogHeader>
         <div className="py-4">
            <p className="text-sm text-muted-foreground">
                Family Name: <span className="font-medium text-foreground">{family.name}</span>
            </p>
         </div>
        <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
