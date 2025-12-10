import { z } from 'zod'

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand_id: z.string(),
    brand: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type Model = z.infer<typeof ModelSchema>