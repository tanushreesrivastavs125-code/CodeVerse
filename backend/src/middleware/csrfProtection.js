import { config } from '../config/env.js';
import { AppError } from './errorHandler.js';
import { AUTH_COOKIE_NAME } from '../config/jwt.js';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

function isAllowedTarget(targetHost, allowedHost, reqHost) {
  if (!targetHost) return false;
  if (targetHost === allowedHost || targetHost === reqHost) {
    return true;
  }
  // In non-production environments, treat localhost and 127.0.0.1 interchangeably on matching port
  if (config.nodeEnv !== 'production') {
    const normalizeLoopback = (h) => (h ? h.replace(/^127\.0\.0\.1/, 'localhost') : h);
    if (normalizeLoopback(targetHost) === normalizeLoopback(allowedHost)) {
      return true;
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

  let allowedHost;
  try {
    allowedHost = new URL(config.corsOrigin).host;
  } catch {
    allowedHost = config.corsOrigin;
  }

  if (origin) {
    let originHost;
    try {
      originHost = new URL(origin).host;
    } catch {
      return next(new AppError('Forbidden: malformed Origin header.', 403, 'CSRF_ORIGIN_INVALID'));
    }

    if (!isAllowedTarget(originHost, allowedHost, host) && origin !== config.corsOrigin) {
      return next(
        new AppError('Cross-site request forgery protection: untrusted origin.', 403, 'CSRF_ORIGIN_INVALID')
      );
    }
  } else if (hasCookieAuth && !hasAuthHeader) {
    // If request has cookie credentials but lacks origin header, check referer
    if (referer) {
      try {
        const refUrl = new URL(referer);
        if (!isAllowedTarget(refUrl.host, allowedHost, host) && refUrl.origin !== config.corsOrigin) {
          return next(
            new AppError('Cross-site request forgery protection: untrusted referer.', 403, 'CSRF_ORIGIN_INVALID')
          );
        }
      } catch {
        return next(new AppError('Forbidden: malformed Referer header.', 403, 'CSRF_ORIGIN_INVALID'));
      }
    }
  }

  next();
}

