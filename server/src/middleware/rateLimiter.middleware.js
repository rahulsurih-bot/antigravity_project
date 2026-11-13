import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please wait before making further calls.',
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      details: ['Request threshold reached. Please try again in a few minutes.']
    }
  }
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    success: false,
    message: 'AI advisory rate limit exceeded.',
    data: null,
    error: {
      code: 'AI_QUOTA_EXCEEDED',
      details: ['AI request quota exceeded. Please wait 60 seconds before generating additional advisories.']
    }
  }
});
