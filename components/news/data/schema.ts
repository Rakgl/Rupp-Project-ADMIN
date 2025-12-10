import { z } from 'zod'

// Helper for multilingual fields (EN and KM only as requested)
const MultilingualString = z.object({
  en: z.string().default(''),
  km: z.string().default(''),
}).default({ en: '', km: '' })

// Schema for our News API
export const NewsSchema = z.object({
  id: z.string(),
  name: MultilingualString,
  description: MultilingualString,
  image_url: z.string().nullable(),
  status: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type News = z.infer<typeof NewsSchema>