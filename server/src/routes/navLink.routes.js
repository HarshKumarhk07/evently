import { Router } from 'express';
import { listNavLinks, lookupNavLink } from '../controllers/navLink.controller.js';

const router = Router();
router.get('/', listNavLinks);
router.get('/lookup', lookupNavLink);
export default router;
