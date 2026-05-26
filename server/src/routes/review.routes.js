import { Router } from 'express';
import * as review from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewSchema } from '../validators/booking.validator.js';

const router = Router();

router.get('/', review.listReviews);
router.post('/', protect, validate(reviewSchema), review.createReview);
router.delete('/:id', protect, review.deleteReview);

export default router;
