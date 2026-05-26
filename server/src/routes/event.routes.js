import { Router } from 'express';
import Event from '../models/Event.js';
import { createListingController } from '../controllers/listing.controller.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { eventSchema } from '../validators/listing.validator.js';

const router = Router();
const c = createListingController(Event, 'Event');

router.get('/', c.list);
router.get('/:idOrSlug', optionalAuth, c.getBySlug);
router.get('/:id/similar', c.getSimilar);

router.post('/', protect, restrictTo('admin'), validate(eventSchema), c.create);
router.patch('/:id', protect, restrictTo('admin'), c.update);
router.delete('/:id', protect, restrictTo('admin'), c.remove);

export default router;
