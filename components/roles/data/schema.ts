// data/schema.ts
import { z } from 'zod'

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
})

export type Task = z.infer<typeof taskSchema>

// --- NEW: Role Schema ---
// Basic permission schema, expand if needed
export const permissionSchema = z.object({
  id: z.number(), // Or z.string() if your API returns it as string
  name: z.string(),
  // Add other permission fields if necessary
})

export type Permission = z.infer<typeof permissionSchema>

// Role schema based on your Laravel API structure
export const roleSchema = z.object({
  id: z.number(), // Or z.string()
  name: z.string(),
  description: z.string().nullable().optional(),
  status: z.string().optional(), // e.g., 'ACTIVE', 'INACTIVE'
  created_by: z.string().optional(),
  permissions: z.array(permissionSchema).optional(),
})

export type Role = z.infer<typeof roleSchema>
