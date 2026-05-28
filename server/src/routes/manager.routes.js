import { Router } from 'express';
import * as manager from '../controllers/manager.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { managerDocsUpload } from '../middleware/upload.js';
import {
  managerRegisterSchema,
  verifyEmailSchema,
} from '../validators/manager.validator.js';

const router = Router();

/* Public — manager onboarding. Multer must parse the multipart body first
   so the validator can see the text fields. */
router.post(
  '/register',
  authLimiter,
  managerDocsUpload,
  validate(managerRegisterSchema),
  manager.registerManager,
);
router.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailSchema),
  manager.verifyEmail,
);

/* Manager-only — dashboard endpoints. */
router.use(protect, restrictTo('manager', 'admin'));
router.get('/me', manager.getMyManagerProfile);
router.get('/me/listings', manager.getMyListings);
router.get('/me/bookings', manager.getMyBookings);

export default router;
