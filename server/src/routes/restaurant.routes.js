import { Router } from 'express';
import Restaurant from '../models/Restaurant.js';
import { createListingController } from '../controllers/listing.controller.js';
import { protect, optionalAuth, requireApprovedManagerOrAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { restaurantSchema } from '../validators/listing.validator.js';

const router = Router();
const c = createListingController(Restaurant, 'Restaurant');

router.get('/', c.list);
router.get('/:idOrSlug', optionalAuth, c.getBySlug);
router.get('/:id/similar', c.getSimilar);

/* Approved managers and admins can mutate listings. The controller
   enforces per-document ownership for managers. */
router.post('/', protect, requireApprovedManagerOrAdmin, validate(restaurantSchema), c.create);
router.patch('/:id', protect, requireApprovedManagerOrAdmin, c.update);
router.delete('/:id', protect, requireApprovedManagerOrAdmin, c.remove);

export default router;
