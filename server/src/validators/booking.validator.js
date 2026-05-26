import { z } from 'zod';

const contact = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
});

export const createBookingSchema = z
  .object({
    itemType: z.enum(['Restaurant', 'Play', 'Event']),
    itemId: z.string().min(1, 'Listing is required'),
    contact,
    reservation: z
      .object({
        date: z.string(),
        time: z.string(),
        guests: z.coerce.number().int().min(1).max(30),
      })
      .optional(),
    showtime: z.string().optional(),
    tickets: z
      .array(
        z.object({
          category: z.string(),
          price: z.coerce.number().min(0),
          quantity: z.coerce.number().int().min(1),
        }),
      )
      .optional(),
    seats: z.array(z.string()).optional(),
  })
  .refine((d) => d.itemType !== 'Restaurant' || d.reservation, {
    message: 'Reservation details are required for dining',
    path: ['reservation'],
  })
  .refine((d) => d.itemType === 'Restaurant' || (d.tickets && d.tickets.length > 0), {
    message: 'Select at least one ticket',
    path: ['tickets'],
  });

export const reviewSchema = z.object({
  itemType: z.enum(['Restaurant', 'Play', 'Event']),
  itemId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
