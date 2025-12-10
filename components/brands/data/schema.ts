import { z } from 'zod'

export const BrandsSchema = z.object({
  id: z.string(),
  name: z.string(),
  image_url: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type Brands = z.infer<typeof BrandsSchema>