import { Router } from 'express';
import {
  createOvertimeRequest,
  getMyOvertimeRequests,
  getOvertimeRequests,
  reviewOvertimeRequest,
} from './overtime.controller.js';
import { createOvertimeSchema, reviewOvertimeSchema } from './overtime.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

// Employee routes
router.post('/', validateRequest(createOvertimeSchema), createOvertimeRequest);
router.get('/me', getMyOvertimeRequests);

// Manager / Admin review queues
router.get('/', authorizeRoles('manager', 'admin'), getOvertimeRequests);
router.patch('/:id/review', authorizeRoles('manager', 'admin'), validateRequest(reviewOvertimeSchema), reviewOvertimeRequest);

export const overtimeRoutes = router;
