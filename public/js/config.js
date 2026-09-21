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
  
  // Currency symbol (Indian Rupee)
  CURRENCY_SYMBOL: '₹',

  // Format monetary value using Indian numbering system (e.g. ₹1,00,000)
  formatINR(val) {
    if (val === null || val === undefined || isNaN(val)) return '₹0';
    return '₹' + Math.round(Number(val)).toLocaleString('en-IN');
  }
};

window.APP_CONFIG = CONFIG;
