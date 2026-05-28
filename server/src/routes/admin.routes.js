import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { uploadImage } from '../controllers/upload.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { rejectManagerSchema } from '../validators/manager.validator.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', admin.getStats);
router.get('/users', admin.listUsers);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);
router.get('/bookings', admin.listBookings);
router.patch('/bookings/:id', admin.updateBookingStatus);
router.post('/uploads', upload.single('image'), uploadImage);

/* Manager approval queue */
router.get('/managers', admin.listManagers);
router.get('/managers/:id', admin.getManager);
router.post('/managers/:id/approve', admin.approveManager);
router.post('/managers/:id/reject', validate(rejectManagerSchema), admin.rejectManager);

// Admin: manage cities
import * as city from '../controllers/city.controller.js';
router.post('/cities', city.createCity);
router.patch('/cities/:id', city.updateCity);
router.delete('/cities/:id', city.deleteCity);

export default router;
