import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  type: z.enum(['PRODUCT', 'PET']).default('PRODUCT'),
  created_at: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;
