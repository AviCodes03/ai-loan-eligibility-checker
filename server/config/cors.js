/**
 * Secure CORS Configuration
 * Manages allowed origins, methods, and headers for both monolithic and decoupled deployments.
 */

const AppError = require('../utils/AppError');

function getCorsOptions() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. same-origin static files, mobile clients, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Allow wildcard in development
      if (allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Check if origin matches allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      // In development mode, allow localhost on any port for demo convenience
      if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        return callback(null, true);
      }

      return callback(new AppError(`Origin '${origin}' not allowed by CORS policy.`, 403));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours preflight cache
  };
}

module.exports = getCorsOptions;
