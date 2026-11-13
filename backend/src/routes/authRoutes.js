import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, currentUser } from '../controllers/authController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

// Protect the login endpoint only. Session checks, registration and logout
// must not consume the failed-login allowance.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => res.status(429).json({
    message: 'Too many failed login attempts. Please wait 15 minutes before trying again.'
  })
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, currentUser);

export default router;
