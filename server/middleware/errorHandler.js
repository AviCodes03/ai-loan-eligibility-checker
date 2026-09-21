/**
 * Centralized Error Handling Middleware
 * Ensures uniform JSON error structures, appropriate HTTP status codes,
 * and prevents stack trace or secret leaks.
 */

const { redactSensitiveData } = require('./logger');

/**
 * Handles JSON parsing syntax errors (e.g. malformed body in POST)
 */
function jsonSyntaxErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body. Please verify JSON formatting.',
      details: [err.message]
    });
  }
  return next(err);
}

/**
 * 404 Not Found Handler for unmatched routes
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
}

/**
 * Global application error handler
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Sanitize any potential sensitive content from error message
  const rawMessage = err.userMessage || err.message || 'An unexpected error occurred while processing your request.';
  const sanitizedMessage = typeof rawMessage === 'string'
    ? rawMessage.replace(/sk-ant-[a-zA-Z0-9_-]+/g, '[REDACTED_API_KEY]')
    : 'An error occurred.';

  const sanitizedDetails = err.details ? redactSensitiveData(err.details) : null;

  // Log error safely without sensitive headers or data
  if (statusCode >= 500) {
    console.error(`[Internal Error] ${req.method} ${req.originalUrl}: ${sanitizedMessage}`);
    if (!isProduction && err.stack) {
      console.error(err.stack);
    }
  }

  return res.status(statusCode).json({
    success: false,
    error: sanitizedMessage,
    details: sanitizedDetails,
    ...(isProduction ? {} : { debugStack: err.stack ? err.stack.split('\n').slice(0, 3) : undefined })
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
  jsonSyntaxErrorHandler
};
