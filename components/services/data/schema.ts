import { z } from 'zod'

export const serviceSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  price: z.string(),
  duration_minutes: z.number(),
  image_url: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
})

export type Service = z.infer<typeof serviceSchema>
