import { Router } from 'express';
import * as user from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { updateProfileSchema } from '../validators/auth.validator.js';

const router = Router();

router.use(protect);

router.patch('/me', validate(updateProfileSchema), user.updateProfile);
router.post('/me/avatar', upload.single('image'), user.updateAvatar);
router.get('/me/favorites', user.getFavorites);
router.post('/me/favorites', user.toggleFavorite);
router.get('/me/recently-viewed', user.getRecentlyViewed);

export default router;
