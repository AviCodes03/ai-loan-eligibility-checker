/**
 * Custom Operational Application Error Class
 * Formats errors with HTTP status codes and optional diagnostic details.
 */

class AppError extends Error {
  /**
   * @param {string} message - User-facing error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {Array<string>|object} [details=null] - Optional diagnostic details
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.status = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
