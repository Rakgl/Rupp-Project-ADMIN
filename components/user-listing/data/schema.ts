import { z } from 'zod'

export const UserListingImageSchema = z.object({
  id: z.string(),
  image_url: z.string(),
  is_primary: z.boolean().or(z.number()).optional(),
})

export const UserListingSchema = z.object({
  id: z.string(),
  model_id: z.string(),
  
  year: z.number().or(z.string()),
  condition: z.string(),
  price: z.string().or(z.number()),
  description: z.string(),
  status: z.string(),
  
  // Relations
  model: z.object({
    id: z.string(),
    name: z.string(),
    brand: z.object({
      id: z.string(),
      name: z.string(),
    }).optional(),
  }).optional(),

  images: z.array(UserListingImageSchema).optional(),
})

export type UserListing = z.infer<typeof UserListingSchema>