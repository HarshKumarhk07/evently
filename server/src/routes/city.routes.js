import { Router } from 'express';
import * as city from '../controllers/city.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', city.listCities);
router.get('/nearest', city.nearestCity);
router.get('/:id', city.getCity);

export default router;
