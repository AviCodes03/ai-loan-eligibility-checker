/**
 * API Routes Definition
 */

const express = require('express');
const router = express.Router();

/**
 * System Health & Configuration Endpoint
 */
router.get('/health', (req, res) => {
  const hasClaudeKey = Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0);
  const hasSheetsWebhook = Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL && process.env.GOOGLE_SHEETS_WEBHOOK_URL.trim().length > 0);

  return res.json({
    success: true,
    data: {
      status: 'healthy',
      app: 'AI Loan Eligibility Checker',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      integrations: {
        aiProvider: hasClaudeKey ? 'claude-3-5-sonnet' : 'rule-based-offline-fallback',
        googleSheets: hasSheetsWebhook ? 'connected' : 'unconfigured'
      },
      disclaimer: 'Educational & Demo Project - Not for official banking or financial decisions.'
    }
  });
});

module.exports = router;
