import { z } from 'zod'

export const petSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.string(),
  image_url: z.string().nullable(),
})

export type Pet = z.infer<typeof petSchema>

export const petListingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  pet_id: z.string(),
  listing_type: z.string(),
  price: z.number().or(z.string()),
  status: z.string(),
  pet: petSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export type PetListing = z.infer<typeof petListingSchema>
