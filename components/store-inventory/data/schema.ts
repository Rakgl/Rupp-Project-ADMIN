import { z } from 'zod';

export const storeInventorySchema = z.object({
  id: z.string(),
  store_id: z.string(),
  store_name: z.string().optional(),
  product_id: z.string(),
  product_name: z.string().optional(),
  quantity: z.number().default(0),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).default('IN_STOCK'),
  last_restocked_at: z.string().optional(),
});

export type StoreInventory = z.infer<typeof storeInventorySchema>;
