/**
 * Request logger middleware.
 * Logs every incoming request with timestamp and response code.
 * Format: [YYYY-MM-DD] METHOD /path - STATUS OK/ERROR
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  const formatDate = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  res.on('finish', () => {
    const elapsed = Date.now() - start;
    const status = res.statusCode;
    const statusText = status >= 400 ? 'ERROR' : 'OK';
    const method = req.method;
    const path = req.originalUrl || req.url;
    console.log(`[${formatDate()}] ${method} ${path} - ${status} ${statusText} (${elapsed}ms)`);
  });

  next();
}
