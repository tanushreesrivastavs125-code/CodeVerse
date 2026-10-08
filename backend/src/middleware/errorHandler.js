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
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.isOperational ? err.message : 'An unexpected internal error occurred.',
      details: process.env.NODE_ENV === 'development' ? err.stack : null
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
