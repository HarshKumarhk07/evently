import { Router } from 'express';
import authRoutes from './auth.routes.js';
import restaurantRoutes from './restaurant.routes.js';
import playRoutes from './play.routes.js';
import eventRoutes from './event.routes.js';
import bookingRoutes from './booking.routes.js';
import reviewRoutes from './review.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Bookify API is healthy', time: new Date().toISOString() }),
);

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/plays', playRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
