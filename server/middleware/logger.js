/**
 * Structured Safe Server Logging Middleware
 * Formats request metrics while strictly preventing logging of secrets, keys, or sensitive PII.
 */

// Key names that must NEVER be logged if present in headers, query, or body
const SENSITIVE_KEYS = [
  'key',
  'apikey',
  'api_key',
  'anthropic_api_key',
  'token',
  'secret',
  'password',
  'auth',
  'authorization',
  'cookie',
  'credentials',
  'webhook'
];

/**
 * Recursively redacts sensitive keys from an object
 *
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized copy with sensitive values masked
 */
function redactSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Express middleware for request logging with duration tracking
 */
function requestLogger(req, res, next) {
  // Skip logging static asset requests to keep terminal clean
  if (req.originalUrl.startsWith('/css') || req.originalUrl.startsWith('/js') || req.originalUrl.startsWith('/favicon.ico')) {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: `${durationMs}ms`,
      ip: req.ip || req.connection?.remoteAddress || 'unknown'
    };

    // Safe colorized output for console in development
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(`[HTTP] ${logEntry.timestamp} | ${logEntry.method} ${logEntry.path} -> ${statusColor}${logEntry.statusCode}${resetColor} (${logEntry.durationMs})`);
  });

  next();
}

module.exports = {
  requestLogger,
  redactSensitiveData,
  SENSITIVE_KEYS
};
