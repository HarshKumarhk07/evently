import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  city: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
});
