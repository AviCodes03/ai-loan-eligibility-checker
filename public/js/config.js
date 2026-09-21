/**
 * Frontend Configuration
 * Automatically detects whether running monolithic (same-origin) or decoupled.
 */

const CONFIG = {
  // If backend is hosted separately, update API_BASE_URL (e.g. 'https://your-api.onrender.com/api')
  API_BASE_URL: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? '/api'
    : '/api',
  
  // Timeout for network requests (15 seconds)
  REQUEST_TIMEOUT_MS: 15000,
  
  // Currency symbol
  CURRENCY_SYMBOL: '$'
};

window.APP_CONFIG = CONFIG;
