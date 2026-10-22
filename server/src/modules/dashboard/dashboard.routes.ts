import { Router } from 'express';
import {
  getEmployeeDashboard,
  getManagerDashboard,
  getAdminDashboard,
} from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/employee', getEmployeeDashboard);
router.get('/manager', authorizeRoles('manager', 'admin'), getManagerDashboard);
router.get('/admin', authorizeRoles('admin'), getAdminDashboard);

export const dashboardRoutes = router;
