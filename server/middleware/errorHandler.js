/**
 * Centralized Error Handling Middleware
 * Ensures uniform JSON error structures and prevents stack trace or secret leaks.
 */

function errorHandler(err, req, res, _next) {
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Do not log sensitive headers or query params
  console.error(`[Error] ${req.method} ${req.originalUrl}: ${err.message || 'Internal Server Error'}`);

  return res.status(statusCode).json({
    success: false,
    error: err.userMessage || err.message || 'An unexpected error occurred while processing your request.',
    details: err.details || null,
    ...(isProduction ? {} : { debugStack: err.stack })
  });
}

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
