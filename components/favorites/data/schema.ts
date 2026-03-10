import { z } from 'zod'

export const userSchema = z.object({
    id: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    name: z.string(),
    phone_number: z.string().nullable(),
    email: z.string().nullable().optional(),
})

export const categorySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    slug: z.string(),
    image_url: z.string().nullable().optional(),
    status: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
})

export const productSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    attributes: z.any().optional(),
    price: z.number(),
    image_url: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    status: z.string(),
    category: categorySchema.nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
})

export const favoriteSchema = z.object({
    id: z.string(),
    user: userSchema.nullable().optional(),
    product: productSchema.nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
})

export type Favorite = z.infer<typeof favoriteSchema>
export type User = z.infer<typeof userSchema>
export type Product = z.infer<typeof productSchema>
