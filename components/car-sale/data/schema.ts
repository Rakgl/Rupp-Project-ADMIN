import { z } from 'zod'

export const TransactionSchema = z.object({
  id: z.string(),
  car_id: z.string(),
  buyer_id: z.string(),
  final_price: z.number().or(z.string()),
  status: z.string().nullable(),
  created_at: z.string().optional(),

  // Relationships
  car: z.object({
    id: z.string(),
    name: z.string(), // Assuming model name or constructed name
    // Add brand info if needed for display
    model: z.object({
        name: z.string(),
        brand: z.object({ name: z.string() }).optional()
    }).optional()
  }).optional(),

  buyer: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
  }).optional(),
})

export type Transaction = z.infer<typeof TransactionSchema>