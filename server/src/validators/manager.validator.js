import { z } from 'zod';

const BUSINESS_TYPES = ['Restaurant', 'Turf', 'Event', 'Play', 'Activity'];

/* Most fields arrive as strings (multipart/form-data has no native types).
   We coerce where it makes sense and validate format for the sensitive IDs. */
export const managerRegisterSchema = z.object({
  name: z.string().min(2, 'Full name is required').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(6, 'A valid phone number is required'),
  city: z.string().min(2, 'City is required'),

  businessName: z.string().min(2, 'Business name is required').max(120),
  businessType: z.enum(BUSINESS_TYPES, {
    errorMap: () => ({ message: 'Pick a business type' }),
  }),
  businessAddress: z.string().min(4, 'Business address is required'),
  gstNumber: z.string().optional().default(''),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must look like ABCDE1234F'),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  bankAccountName: z.string().optional().default(''),
  bankAccountNumber: z.string().optional().default(''),
  bankIfsc: z.string().optional().default(''),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10, 'A verification token is required'),
});

export const rejectManagerSchema = z.object({
  reason: z.string().min(4, 'Please provide a short reason').max(400),
});
