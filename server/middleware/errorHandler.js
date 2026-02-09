import { NODE_ENV } from '../config.js';

/**
 * Centralized error handler middleware.
 * Catches errors, logs them, and returns consistent JSON responses.
 */
export function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${status}: ${message}`);
  if (err.stack) console.error(err.stack);

  res.status(status).json({
    error: true,
    message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
}
