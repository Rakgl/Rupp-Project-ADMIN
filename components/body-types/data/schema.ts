import { z } from 'zod'

export const BodyTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  image_url: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type BodyType = z.infer<typeof BodyTypeSchema>