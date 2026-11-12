import * as authService from '../services/authService.js';
import { AUTH_COOKIE_NAME, getAuthCookieOptions, verifyToken } from '../config/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * POST /api/auth/register
 * Handles user registration, issues an HTTP-only session cookie, and returns JWT with safe user profile.
 *
 * @type {import('express').RequestHandler}
 */
export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Handles user authentication, issues an HTTP-only session cookie, and returns signed JWT with safe user profile.
 *
 * @type {import('express').RequestHandler}
 */
export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/guest
 * Quick-play guest session endpoint. Reuses valid existing sessions or creates
 * a real persistent guest account in MongoDB. Rejects client-supplied statistics.
 *
 * @type {import('express').RequestHandler}
 */
export async function guest(req, res, next) {
  try {
    // Strictly reject client attempts to inject role, XP, coins, or completion fields
    if (req.body && typeof req.body === 'object') {
      const forbiddenFields = [
        'role',
        'totalXp',
        'xp',
        'level',
        'coins',
        'stars',
        'completed',
        'unlocked',
        'userId',
        'id'
      ];
      for (const field of forbiddenFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          throw new AppError(
            `Forbidden client-provided field: "${field}". Guest identity and statistics are server-generated.`,
            400,
            'VALIDATION_ERROR'
          );
        }
      }
    }

    // Inspect candidate credentials to reuse an existing valid session
    let existingUserId = null;
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
    let candidateToken = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      candidateToken = authHeader.slice(7).trim();
    } else if (cookieToken) {
      candidateToken = cookieToken;
    }

    if (candidateToken) {
      try {
        const decoded = verifyToken(candidateToken);
        if (decoded && decoded.id) {
          existingUserId = decoded.id;
        }
      } catch {
        // Invalid or expired token: fall through to fresh guest creation
      }
    }

    const result = await authService.createOrResumeGuest(existingUserId);
    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
    res.status(result.isExisting ? 200 : 201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Clears the HTTP-only session cookie with matching attributes.
 * Note: Clears the browser session; issued stateless JWTs remain valid until expiration.
 *
 * @type {import('express').RequestHandler}
 */
export function logout(_req, res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getAuthCookieOptions(),
    maxAge: 0
  });
  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully.'
    }
  });
}

/**
 * GET /api/auth/profile
 * Retrieves authenticated user identity and claims.
 *
 * @type {import('express').RequestHandler}
 */
export async function getProfile(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
}
