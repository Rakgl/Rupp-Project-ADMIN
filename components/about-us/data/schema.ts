import { z } from 'zod'

export const multilingualSchema = z.object({
  en: z.string().optional(),
  kh: z.string().optional(),
})

export const multilingualArraySchema = z.object({
  en: z.array(z.string()).optional(),
  kh: z.array(z.string()).optional(),
})

export const aboutUsSchema = z.object({
  id: z.string(), // UUID is a string
  title: multilingualSchema,
  description: multilingualSchema,
  list_text: multilingualArraySchema.optional(),
  image_url: z.string().nullable().optional(),
  status: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type AboutUs = z.infer<typeof aboutUsSchema>