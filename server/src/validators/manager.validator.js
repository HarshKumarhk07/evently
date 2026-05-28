import { z } from 'zod';

const BUSINESS_TYPES = ['Restaurant', 'Turf', 'Event', 'Play', 'Activity'];

/* Most fields arrive as strings (multipart/form-data has no native types).
   We coerce where it makes sense and validate format for the sensitive IDs. */
export const managerRegisterSchema = z.object({
  name: z.string().min(2, 'Full name is required').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(6, 'A valid phone number is required'),
  // `city` is optional because the onboarding UI now autofills address
  // from the user's location and doesn't require a separate city field.
  city: z.string().optional().default(''),

  businessName: z.string().min(2, 'Business name is required').max(120),
  businessType: z.enum(BUSINESS_TYPES, {
    errorMap: () => ({ message: 'Pick a business type' }),
  }),
  businessAddress: z.string().min(4, 'Business address is required'),
  gstNumber: z.string().optional().default(''),
  // Allow lowercase input from the client (we uppercase it later in the
  // controller), so accept the PAN case-insensitively here.
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, 'PAN must look like ABCDE1234F'),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  bankAccountName: z.string().optional().default(''),
  bankAccountNumber: z.string().optional().default(''),
  bankIfsc: z.string().optional().default(''),
});

/* Legacy token-link path — kept for backwards compatibility. */
export const verifyEmailSchema = z.object({
  token: z.string().min(10, 'A verification token is required'),
});

/* OTP-code path — the canonical flow used by the new onboarding UI. */
export const verifyOtpSchema = z.object({
  email: z.string().email('Enter a valid email'),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const resendOtpSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const rejectManagerSchema = z.object({
  reason: z.string().min(4, 'Please provide a short reason').max(400),
});

/* Admin debug endpoint — send a test email to any address. */
export const emailTestSchema = z.object({
  to: z.string().email('Enter a valid email'),
  subject: z.string().min(2).max(120).optional().default('Bookify email test'),
  message: z.string().max(1000).optional().default('This is a Bookify email test.'),
});
