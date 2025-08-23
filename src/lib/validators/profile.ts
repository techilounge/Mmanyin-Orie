
import * as z from 'zod';

export const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: 'Display name must be at least 2 characters.',
  }).max(50, {
    message: 'Display name must not be longer than 50 characters.',
  }),
});
