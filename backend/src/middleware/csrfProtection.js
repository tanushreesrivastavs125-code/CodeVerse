import { config } from '../config/env.js';
import { AppError } from './errorHandler.js';
import { AUTH_COOKIE_NAME } from '../config/jwt.js';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

/**
 * Normalizes an origin or referer string into standard protocol + host (lowercase).
 * Returns null if malformed.
 */
export function normalizeOrigin(originStr) {
  if (!originStr || typeof originStr !== 'string') return null;
  try {
    const u = new URL(originStr);
    return `${u.protocol}//${u.host}`.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Validates whether an incoming origin is permitted by the configured CORS origins.
 * In non-production environments, permits loopback interchangeability (localhost <-> 127.0.0.1 on identical port).
 * Rejects arbitrary origins, credentialed wildcards, or mismatched protocols/ports.
 */
export function isAllowedOrigin(incomingOrigin, allowedOrigins = config.corsOrigins, nodeEnv = config.nodeEnv) {
  if (!incomingOrigin) return false;
  const normalizedIncoming = normalizeOrigin(incomingOrigin);
  if (!normalizedIncoming) return false;

  let incomingUrl;
  try {
    incomingUrl = new URL(normalizedIncoming);
  } catch {
    return false;
  }

  for (const allowed of (allowedOrigins || [])) {
    const normalizedAllowed = normalizeOrigin(allowed);
    if (!normalizedAllowed) continue;

    // Strict protocol and host match
    if (normalizedIncoming === normalizedAllowed) {
      return true;
    }

    // In development / test, allow localhost and 127.0.0.1 interchangeability on identical port
    if (nodeEnv !== 'production') {
      try {
        const allowedUrl = new URL(normalizedAllowed);
        if (
          incomingUrl.protocol === allowedUrl.protocol &&
          incomingUrl.port === allowedUrl.port
        ) {
          const isLoopback = (hostname) => hostname === 'localhost' || hostname === '127.0.0.1';
          if (isLoopback(incomingUrl.hostname) && isLoopback(allowedUrl.hostname)) {
            return true;
          }
        }
      } catch {
        // Continue checking other origins
      }
    }
  }

  return false;
}

/**
 * Origin and Referer validation middleware for state-changing browser mutations.
 * Protects cookie-authenticated requests from Cross-Site Request Forgery (CSRF).
 *
 * @type {import('express').RequestHandler}
 */
export function csrfProtection(req, _res, next) {
  // Safe read methods (GET, HEAD, OPTIONS) do not require CSRF origin validation
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    return next();
  }

  // If request is authenticated via an explicit Authorization header, CSRF is not applicable
  const hasAuthHeader = Boolean(req.headers.authorization);
  const hasCookieAuth = Boolean(req.cookies?.[AUTH_COOKIE_NAME]);

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.get('host');

  if (origin) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) {
      return next(new AppError('Forbidden: malformed Origin header.', 403, 'CSRF_ORIGIN_INVALID'));
    }

    // Check if origin is allowed or is exact same-host as the requested server
    const isSameHost = host && normalizeOrigin(`http://${host}`)?.endsWith(`//${host}`);
    const matchesReqHost = isSameHost && new URL(normalizedOrigin).host === host;

    if (!isAllowedOrigin(normalizedOrigin, config.corsOrigins, config.nodeEnv) && !matchesReqHost) {
      return next(
        new AppError(
          `Cross-site request forgery protection: untrusted origin "${origin}".`,
          403,
          'CSRF_ORIGIN_INVALID'
        )
      );
    }
  } else if (hasCookieAuth && !hasAuthHeader) {
    // If request has cookie credentials but lacks origin header, check referer
    if (referer) {
      const normalizedReferer = normalizeOrigin(referer);
      if (!normalizedReferer) {
        return next(new AppError('Forbidden: malformed Referer header.', 403, 'CSRF_ORIGIN_INVALID'));
      }

      const matchesReqHost = host && new URL(normalizedReferer).host === host;
      if (!isAllowedOrigin(normalizedReferer, config.corsOrigins, config.nodeEnv) && !matchesReqHost) {
        return next(
          new AppError(
            `Cross-site request forgery protection: untrusted referer "${referer}".`,
            403,
            'CSRF_ORIGIN_INVALID'
          )
        );
      }
    }
  }

  next();
}

export default csrfProtection;
