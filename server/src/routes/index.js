import { Router } from 'express';
import authRoutes from './auth.routes.js';
import restaurantRoutes from './restaurant.routes.js';
import playRoutes from './play.routes.js';
import eventRoutes from './event.routes.js';
import bookingRoutes from './booking.routes.js';
import reviewRoutes from './review.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import cityRoutes from './city.routes.js';
import geocodeRoutes from './geocode.routes.js';
import managerRoutes from './manager.routes.js';
import env from '../config/env.js';

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
router.use('/cities', cityRoutes);
router.use('/geocode', geocodeRoutes);
router.use('/managers', managerRoutes);

// Development-only mail-check endpoint to inspect mail config and optionally
// perform a test send. Enabled only when not in production.
if (!env.isProd) {
  router.get('/dev/mail-check', (_req, res) =>
    res.json({
      success: true,
      hasMail: env.hasMail,
      senderEmail: env.brevo.senderEmail,
      apiKeyPresent: Boolean(env.brevo.apiKey),
    }),
  );
}

export default router;
