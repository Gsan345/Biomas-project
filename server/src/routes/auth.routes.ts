import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/auth.controller';
import {
  registerSellerSchema,
  registerBuyerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';
import { z } from 'zod';

const router = Router();

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Too many auth requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────

// Register (validates based on role)
router.post('/register', authLimiter, async (req, res, next) => {
  const role = req.body?.role;
  if (role === 'SELLER') {
    return validate(registerSellerSchema)(req, res, () =>
      register(req, res, next)
    );
  } else if (role === 'BUYER') {
    return validate(registerBuyerSchema)(req, res, () =>
      register(req, res, next)
    );
  } else {
    res.status(400).json({ success: false, error: 'role must be SELLER or BUYER' });
  }
});

router.get('/verify-email', verifyEmail);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getMe);

export default router;
