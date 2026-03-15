import { z } from 'zod'

export const userSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
})

export const productSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    attributes: z.any().optional(),
    price: z.number().nullable().optional(),
    image_url: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
})

export const petSchema = z.object({
    id: z.string(),
    user_id: z.string().nullable().optional(),
    category_id: z.string().nullable().optional(),
    name: z.string(),
    species: z.string().nullable().optional(),
    breed: z.string().nullable().optional(),
    weight: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    medical_notes: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
})

export const favoriteSchema = z.object({
    id: z.string(),
    user: userSchema.nullable().optional(),
    type: z.enum(['product', 'pet']),
    details: z.union([productSchema, petSchema]),
    created_at: z.string(),
    updated_at: z.string(),
})

export type Favorite = z.infer<typeof favoriteSchema>
export type User = z.infer<typeof userSchema>
export type Product = z.infer<typeof productSchema>
export type Pet = z.infer<typeof petSchema>
