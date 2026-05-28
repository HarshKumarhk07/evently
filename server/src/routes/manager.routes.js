import { Router } from 'express';
import * as manager from '../controllers/manager.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { managerDocsUpload } from '../middleware/upload.js';
import {
  managerRegisterSchema,
  verifyEmailSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from '../validators/manager.validator.js';

const router = Router();

/* Public — manager onboarding. Multer parses the multipart body first so
   the validator can see the text fields. */
router.post(
  '/register',
  authLimiter,
  managerDocsUpload,
  validate(managerRegisterSchema),
  manager.registerManager,
);

/* OTP-code flow (canonical). */
router.post(
  '/verify-otp',
  authLimiter,
  validate(verifyOtpSchema),
  manager.verifyOtp,
);
router.post(
  '/resend-otp',
  authLimiter,
  validate(resendOtpSchema),
  manager.resendOtp,
);

/* Legacy token-link path — kept for any verification emails already in
   inboxes. New onboarding uses the OTP endpoints above. */
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
