import { z } from 'zod'

export const ReviewSchema = z.object({
  id: z.string(),
  rating: z.number(),
  comment: z.string().nullable(),
  created_at: z.string(),
  
  // Nested Relations
  model: z.object({
    id: z.string(),
    name: z.string(),
    brand: z.object({
      id: z.string(),
      name: z.string(),
      image_url: z.string().nullable(),
    }),
  }),
})

export type Review = z.infer<typeof ReviewSchema>