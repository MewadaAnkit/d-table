import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notification.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export const notificationRoutes = router;
