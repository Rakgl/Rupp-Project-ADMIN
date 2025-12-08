import { z } from 'zod'

// Existing BrandsSchema...

export const CarImageSchema = z.object({
  id: z.string(),
  car_id: z.string(),
  image_url: z.string(),
  is_primary: z.boolean().or(z.number()),
})

export type CarImage = z.infer<typeof CarImageSchema>

export const CarSchema = z.object({
  id: z.string(),
  model_id: z.string(),
  body_type_id: z.string().nullable(),
  stock_quantity: z.number(),
  status: z.string().nullable(),
  year: z.number().or(z.string()),
  price: z.string().or(z.number()).nullable(),
  seat: z.number().nullable(),
  engine: z.string().nullable(),
  door: z.number().nullable(),
  fuel_type: z.string(),
  condition: z.string(),
  transmission: z.string(),
  lease_price_per_month: z.number().nullable(),
  
  // Relations from API Resource
  model: z.object({
    id: z.string(),
    name: z.string(),
    brand: z.object({
      id: z.string(),
      name: z.string(),
      image_url: z.string().nullable(),
    }).optional(),
  }).optional(),
  
  body_type: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  
  images: z.array(CarImageSchema).optional(),
})

export type Car = z.infer<typeof CarSchema>