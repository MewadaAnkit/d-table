import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, logout, getMe } from './auth.controller.js';
import { signupSchema, loginSchema } from './auth.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
});

router.post('/signup', authLimiter, validateRequest(signupSchema), signup);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export const authRoutes = router;
