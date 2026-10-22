import { Router } from 'express';
import {
  getUsers,
  getManagersList,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} from './users.controller.js';
import {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  deleteUserSchema,
} from './users.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('admin'));

router.get('/', getUsers);
router.post('/', validateRequest(createUserSchema), createUser);
router.get('/managers', getManagersList);
router.get('/:id', getUserById);
router.patch('/:id', validateRequest(updateUserSchema), updateUser);
router.patch('/:id/status', validateRequest(updateStatusSchema), updateUserStatus);
router.delete('/:id', validateRequest(deleteUserSchema), deleteUser);

export const usersRoutes = router;

