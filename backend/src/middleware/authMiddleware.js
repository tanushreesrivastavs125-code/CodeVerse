import { verifyToken, AUTH_COOKIE_NAME } from '../config/jwt.js';
import { AppError } from './errorHandler.js';

/**
 * Express middleware to authenticate JWT access tokens via Bearer header or HTTP-only cookie.
 *
 * Precedence Rule:
 * - If an Authorization header is explicitly supplied, it takes strict precedence.
 * - If the supplied Authorization header is malformed, invalid, or expired, authentication
 *   fails immediately (401 Unauthorized) without falling back to a cookie.
 * - If no Authorization header is present, authentication falls back to the HTTP-only cookie.
 * - If neither is present, request is rejected with 401 Unauthorized.
 *
 * @type {import('express').RequestHandler}
 */
export function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];

  let token = null;
  let authSource = null;

  if (authHeader !== undefined && authHeader !== null && authHeader !== '') {
    // Explicit Authorization header provided
    authSource = 'header';
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return next(
        new AppError('Malformed authorization header. Format must be "Bearer <token>".', 401, 'UNAUTHORIZED')
      );
    }

    token = authHeader.slice(7).trim();
    if (token.length === 0) {
      return next(
        new AppError('Malformed authorization header. Token cannot be empty.', 401, 'UNAUTHORIZED')
      );
    }
  } else if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    // Cookie-based session authentication fallback
    authSource = 'cookie';
    token = cookieToken.trim();
  } else {
    return next(
      new AppError('Authentication required. Missing authorization credentials.', 401, 'UNAUTHORIZED')
    );
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return next(new AppError('Invalid token claims.', 401, 'INVALID_TOKEN'));
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role || 'user'
    };
    req.authSource = authSource;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(
        new AppError('Authentication token has expired. Please log in again.', 401, 'TOKEN_EXPIRED')
      );
    }

    if (err.name === 'JsonWebTokenError') {
      return next(
        new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN')
      );
    }

    return next(
      new AppError('Authentication failed.', 401, 'UNAUTHORIZED')
    );
  }
}

/**
 * Optional authentication middleware.
 * Attaches player identity to req.user if valid credentials (header or cookie) are provided,
 * but allows unauthenticated visitors to proceed anonymously without 401 error.
 *
 * @type {import('express').RequestHandler}
 */
export function optionalAuthMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];

  let token = null;

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    token = cookieToken.trim();
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        req.user = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role || 'user'
        };
      }
    } catch {
      // Proceed unauthenticated on invalid/expired tokens in optional mode
    }
  }

  next();
}
