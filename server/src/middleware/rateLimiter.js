import rateLimit from 'express-rate-limit';

/* Generous global limiter for the whole API. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down' },
});

/* Strict limiter for auth endpoints to blunt credential stuffing. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts, try again in 15 minutes' },
});
