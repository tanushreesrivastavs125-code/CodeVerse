import { AppError } from './errorHandler.js';

const ipAttempts = new Map();
const mentorAttempts = new Map();

export const GUEST_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const GUEST_RATE_LIMIT_MAX = 10; // Max 10 guest creations per window per IP

export const MENTOR_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const MENTOR_RATE_LIMIT_MAX = 20; // Max 20 mentor consultations per minute per player/IP

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
 * In-memory sliding-window rate limiter for the AI mentor endpoint.
 * Keyed by authenticated user ID when available, falling back to client IP.
 *
 * @type {import('express').RequestHandler}
 */
export function mentorRateLimiter(req, _res, next) {
  const key = req.user?.id || req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const attempts = mentorAttempts.get(key) || [];
  const recentAttempts = attempts.filter((ts) => now - ts < MENTOR_RATE_LIMIT_WINDOW_MS);

  if (recentAttempts.length >= MENTOR_RATE_LIMIT_MAX) {
    return next(
      new AppError(
        'Too many mentor requests. Please wait a moment before asking again.',
        429,
        'TOO_MANY_REQUESTS'
      )
    );
  }

  recentAttempts.push(now);
  mentorAttempts.set(key, recentAttempts);
  next();
}

/**
 * Resets the in-memory rate limiter states. Intended for automated test isolation.
 */
export function _resetGuestRateLimiter() {
  ipAttempts.clear();
}

export function _resetMentorRateLimiter() {
  mentorAttempts.clear();
}

