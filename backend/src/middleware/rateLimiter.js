import { AppError } from './errorHandler.js';

const ipAttempts = new Map();

export const GUEST_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const GUEST_RATE_LIMIT_MAX = 10; // Max 10 guest creations per window per IP

/**
 * In-memory sliding-window rate limiter for the guest creation endpoint.
 *
 * @type {import('express').RequestHandler}
 */
export function guestRateLimiter(req, _res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const attempts = ipAttempts.get(ip) || [];
  // Prune expired attempts
  const recentAttempts = attempts.filter((ts) => now - ts < GUEST_RATE_LIMIT_WINDOW_MS);

  if (recentAttempts.length >= GUEST_RATE_LIMIT_MAX) {
    return next(
      new AppError(
        'Too many guest sessions created from this network. Please wait a few minutes before trying again.',
        429,
        'TOO_MANY_REQUESTS'
      )
    );
  }

  recentAttempts.push(now);
  ipAttempts.set(ip, recentAttempts);
  next();
}

/**
 * Resets the in-memory rate limiter state. Intended for automated test isolation.
 */
export function _resetGuestRateLimiter() {
  ipAttempts.clear();
}

