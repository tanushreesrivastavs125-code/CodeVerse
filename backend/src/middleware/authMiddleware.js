import { verifyToken } from '../config/jwt.js';
import { AppError } from './errorHandler.js';

/**
 * Express middleware to authenticate Bearer JWT access tokens.
 * Decodes valid claims and attaches safe user identity to req.user.
 * Rejects missing, malformed, invalid, and expired tokens with 401 Unauthorized.
 *
 * @type {import('express').RequestHandler}
 */
export function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string' || authHeader.trim().length === 0) {
    return next(
      new AppError('Authentication required. Missing authorization header.', 401, 'UNAUTHORIZED')
    );
  }

  if (!authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('Malformed authorization header. Format must be "Bearer <token>".', 401, 'UNAUTHORIZED')
    );
  }

  const token = authHeader.slice(7).trim();
  if (token.length === 0) {
    return next(
      new AppError('Malformed authorization header. Token cannot be empty.', 401, 'UNAUTHORIZED')
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
