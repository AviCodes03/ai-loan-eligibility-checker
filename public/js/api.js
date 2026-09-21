/**
 * Centralized API Client
 * Wraps native fetch with timeout handling, sanitization, and structured errors.
 */

const apiClient = {
  /**
   * Performs an HTTP GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  /**
   * Performs an HTTP POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },

  /**
   * Core request executor with AbortController timeout
   */
  async request(endpoint, options = {}) {
    const baseUrl = window.APP_CONFIG.API_BASE_URL.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${baseUrl}/${cleanEndpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), window.APP_CONFIG.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = (json && (json.error || json.message)) || `Server returned HTTP ${response.status}`;
        const errorDetails = (json && json.details) || null;
        const err = new Error(errorMsg);
        err.details = errorDetails;
        err.status = response.status;
        throw err;
      }

      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('The request timed out. Please check your network connection or server status.');
        timeoutErr.status = 408;
        throw timeoutErr;
      }
      if (!err.status) {
        const networkErr = new Error('Unable to connect to the backend server. Please verify the server is running on http://localhost:3000.');
        networkErr.status = 0;
        throw networkErr;
      }
      throw err;
    }
  }
};

window.apiClient = apiClient;
