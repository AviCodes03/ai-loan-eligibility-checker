/**
 * AI Loan Eligibility Checker - Express Server Entry Point
 * Architecture: Node.js + Express.js
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const getCorsOptions = require('./config/cors');
const { requestLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler, jsonSyntaxErrorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 2. Secure CORS Configuration
app.use(cors(getCorsOptions()));

// 3. Structured Safe Request Logging (secrets & PII strictly redacted)
app.use(requestLogger);

// 4. Rate Limiting (Abuse prevention: 150 requests per 15 min window)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);

// 5. Body Parsing Middleware & JSON Syntax Error Interception
app.use(express.json({ limit: '1mb' }));
app.use(jsonSyntaxErrorHandler);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. Serve static frontend assets from 'public' directory
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// 7. Mount Unified REST API routes
app.use('/api', apiRoutes);

// 8. Single-Page Application (SPA) Fallback Route
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  return res.sendFile(path.join(publicDir, 'index.html'));
});

// 9. Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 10. Start HTTP Server (when not running inside test runner)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 AI Loan Eligibility Checker Server running on:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   AI Provider: ${process.env.ANTHROPIC_API_KEY ? 'Claude API (configured)' : 'Demo Fallback Engine'}`);
    console.log(`   Sheets Webhook: ${process.env.GOOGLE_SHEETS_WEBHOOK_URL ? 'Configured' : 'Offline / Unconfigured'}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
