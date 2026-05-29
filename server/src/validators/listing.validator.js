import { z } from 'zod';

export const restaurantSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  cuisine: z.array(z.string()).optional(),
  priceRange: z.coerce.number().min(1).max(4).optional(),
  costForTwo: z.coerce.number().optional(),
  city: z.string().min(2),
  address: z.string().optional(),
  coverImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
});

export const playSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  genre: z.array(z.string()).optional(),
  language: z.string().optional(),
  duration: z.coerce.number().optional(),
  city: z.string().min(2),
  coverImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  seatCategories: z
    .array(
      z.object({
        name: z.string(),
        price: z.coerce.number(),
        totalSeats: z.coerce.number().optional(),
      }),
    )
    .optional(),
  isFeatured: z.boolean().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  city: z.string().min(2),
  startDate: z.string(),
  endDate: z.string().optional(),
  coverImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  ticketTypes: z
    .array(
      z.object({
        name: z.string(),
        price: z.coerce.number(),
        totalQuantity: z.coerce.number().optional(),
      }),
    )
    .optional(),
  isFeatured: z.boolean().optional(),
});
