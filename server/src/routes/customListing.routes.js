import { Router } from 'express';
import {
  listCustomListings,
  getCustomListing,
  createCustomListing,
  updateCustomListing,
  removeCustomListing,
} from '../controllers/customListing.controller.js';
import { protect, optionalAuth, requireApprovedManagerOrAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listCustomListings);
router.get('/:idOrSlug', optionalAuth, getCustomListing);

router.post('/', protect, requireApprovedManagerOrAdmin, createCustomListing);
router.patch('/:id', protect, requireApprovedManagerOrAdmin, updateCustomListing);
router.delete('/:id', protect, requireApprovedManagerOrAdmin, removeCustomListing);

export default router;
