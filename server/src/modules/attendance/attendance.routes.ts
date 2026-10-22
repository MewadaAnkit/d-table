import { Router } from 'express';
import {
  punchIn,
  punchOut,
  getActiveSession,
  getGeofenceConfig,
  getMyAttendance,
  getTeamAttendance,
  getAllAttendance,
  getAttendanceById,
  updateVerification,
  streamSelfie,
} from './attendance.controller.js';
import { punchInSchema, punchOutSchema, verificationSchema } from './attendance.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// Punch actions (Employees, Managers, Admins can punch)
router.post('/punch-in', validateRequest(punchInSchema), punchIn);
router.post('/punch-out', validateRequest(punchOutSchema), punchOut);
router.get('/active', getActiveSession);
router.get('/geofence-config', getGeofenceConfig);

// Self attendance records
router.get('/me', getMyAttendance);

// Manager team attendance
router.get('/team', authorizeRoles('manager', 'admin'), getTeamAttendance);

// Admin all attendance
router.get('/', authorizeRoles('admin'), getAllAttendance);

// Attendance details & verification
router.get('/:id', getAttendanceById);
router.patch('/:id/verification', authorizeRoles('manager', 'admin'), validateRequest(verificationSchema), updateVerification);

// Authenticated private selfie streaming
router.get('/:id/selfie/:type', streamSelfie);

export const attendanceRoutes = router;
