// data/schema.ts
import { z } from 'zod'

// Helper for multilingual fields
const MultilingualString = z.object({
  en: z.string().default(''),
  kh: z.string().default(''),
}).default({ en: '', kh: '' })

// Schema for our ServiceCard API
export const ServiceCardSchema = z.object({
  id: z.number(),
  title: MultilingualString,
  description: MultilingualString,
  button_text: MultilingualString,
  image_url: z.string(),
  status: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type ServiceCard = z.infer<typeof ServiceCardSchema>
