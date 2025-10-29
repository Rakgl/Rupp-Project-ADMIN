import { z } from 'zod';

// --- Hospital Schema ---
// Schema for Hospital data based on the provided API response
export const hospitalSchema = z.object({
  id: z.string(), // Typically a UUID or string from APIs
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  country: z.string(),
  phone_number: z.string(),
  email: z.string().email().or(z.literal('')).nullable().optional(), // Email can be an empty string, null, or a valid email
  website: z.string().url().or(z.literal('')).nullable().optional(), // Website can be a URL, an empty string, or null
  description: z.string().nullable().optional(), // Description can be null or a string
});

export type Hospital = z.infer<typeof hospitalSchema>;
