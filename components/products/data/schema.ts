import { z } from 'zod';

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().or(z.string()),
  category_id: z.string().nullable().optional(),
  category: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).default('ACTIVE'),
  stock_quantity: z.number().or(z.string()).nullable().optional(),
  created_at: z.string().optional(),
  image_url: z.string().nullable().optional()
});

export type Product = z.infer<typeof productSchema>;
