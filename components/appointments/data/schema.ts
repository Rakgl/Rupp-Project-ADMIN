import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const storeSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const petSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const appointmentSchema = z.object({
  id: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.string(),
  special_requests: z.string().nullable(),
  user: userSchema,
  store: storeSchema,
  pet: petSchema,
  service: serviceSchema,
})

export type Appointment = z.infer<typeof appointmentSchema>
