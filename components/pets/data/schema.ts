import { z } from 'zod'

export const petSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.string(),
  weight: z.string(),
  date_of_birth: z.string(),
  image_url: z.string().nullable(),
  medical_notes: z.string().nullable(),
})

export type Pet = z.infer<typeof petSchema>
