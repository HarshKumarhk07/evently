import { Router } from 'express';
import * as geo from '../controllers/geocode.controller.js';

const router = Router();

router.get('/reverse', geo.reverseGeocode);

export default router;
