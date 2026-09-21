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

const apiRoutes = require('./routes/apiRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Headers with Helmet
// Allow inline styles/scripts for demo flexibility while securing defaults
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

// Cross-Origin Resource Sharing (CORS) Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin static files)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for educational local testing
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Rate Limiting (Abuse prevention)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);

// Request Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static frontend files from 'public' directory
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Mount REST API routes
app.use('/api', apiRoutes);

// Fallback for SPA routing - serve index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  return res.sendFile(path.join(publicDir, 'index.html'));
});

// Centralized 404 and Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start HTTP Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 AI Loan Eligibility Checker Server running on:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   AI Provider: ${process.env.ANTHROPIC_API_KEY ? 'Claude API (configured)' : 'Demo Fallback Engine'}`);
    console.log(`   Sheets Webhook: ${process.env.GOOGLE_SHEETS_WEBHOOK_URL ? 'Configured' : 'Offline / Unconfigured'}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
