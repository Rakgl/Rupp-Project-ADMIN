// data/schema.ts
import { z } from 'zod'

export const multilingualSchema = z.object({
  en: z.string(),
  km: z.string(),
  zh: z.string(),
})

export const contentBlockSchema = z.object({
  id: z.number(),
  title: multilingualSchema.optional(),
  description: multilingualSchema.optional(),
  booking_btn: multilingualSchema.optional(),
  image_url: z.string().nullable().optional(),
  status: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type ContentBlock = z.infer<typeof contentBlockSchema>
