import { z } from 'zod';

export const paymentMethodSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required.'),
  image_url: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['online', 'cash', 'card_on_delivery']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
