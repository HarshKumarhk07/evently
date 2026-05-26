import { Router } from 'express';
import * as booking from '../controllers/booking.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookingSchema } from '../validators/booking.validator.js';

const router = Router();

router.use(protect);

router.post('/', validate(createBookingSchema), booking.createBooking);
router.get('/me', booking.getMyBookings);
router.get('/:id', booking.getBooking);
router.post('/:id/confirm', booking.confirmBooking);
router.patch('/:id/cancel', booking.cancelBooking);

export default router;
