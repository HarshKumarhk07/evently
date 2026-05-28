import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { uploadImage } from '../controllers/upload.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', admin.getStats);
router.get('/users', admin.listUsers);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);
router.get('/bookings', admin.listBookings);
router.patch('/bookings/:id', admin.updateBookingStatus);
router.post('/uploads', upload.single('image'), uploadImage);

// Admin: manage cities
import * as city from '../controllers/city.controller.js';
router.post('/cities', city.createCity);
router.patch('/cities/:id', city.updateCity);
router.delete('/cities/:id', city.deleteCity);

export default router;
