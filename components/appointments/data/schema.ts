import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable().optional(),
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

export const serviceSchema = z.object({
  id: z.string(),
  name: z.any().nullable(), // Can be JSON string or object for translations
  description: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  image_url: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
})

export const appointmentSchema = z.object({
  id: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.string(),
  special_requests: z.string().nullable(),
  user: userSchema,
  pet: petSchema,
  service: serviceSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export type Appointment = z.infer<typeof appointmentSchema>
