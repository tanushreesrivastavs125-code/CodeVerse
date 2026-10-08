import { config } from '../config/env.js';

/**
 * Custom application operational error class.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'OPERATIONAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

/**
 * Global centralized error-handling middleware.
 * Standardizes API error responses into the JSON envelope specified in LLD Section 16.
 * Stack traces are never exposed in API client responses for security.
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  if (!err.isOperational && config.nodeEnv !== 'test') {
    console.error(`[Error] Unhandled server exception: ${err.message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.isOperational ? err.message : 'An unexpected internal error occurred.',
      details: null
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * 404 handler for unmapped routes.
 */
export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: null
    },
    timestamp: new Date().toISOString()
  });
}
