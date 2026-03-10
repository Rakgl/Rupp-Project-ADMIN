import { z } from 'zod'
import { userSchema } from '@/components/favorites/data/schema' // Reusing User schema

export const cartSchema = z.object({
    id: z.string(),
    user: userSchema.nullable().optional(),
    session_id: z.string().nullable().optional(),
    status: z.string(),
    items_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
})

export type Cart = z.infer<typeof cartSchema>
export type User = z.infer<typeof userSchema>
