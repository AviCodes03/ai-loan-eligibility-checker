/**
 * API Routes Definition
 * Unified router for all AI Loan Eligibility Checker API endpoints.
 */

const express = require('express');
const router = express.Router();

const {
  validateLoanCheck,
  validateEmiCalculation,
  validateCreditAnalysis,
  validateAiTipsRequest,
  validateAssessmentSubmission
} = require('../middleware/validator');

const loanController = require('../controllers/loanController');
const emiController = require('../controllers/emiController');
const creditController = require('../controllers/creditController');
const aiController = require('../controllers/aiController');
const sheetsController = require('../controllers/sheetsController');

/**
 * System Health & Configuration Endpoint
 * GET /api/health
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
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      integrations: {
        aiProvider: hasClaudeKey ? 'claude-3-5-sonnet' : 'rule-based-offline-fallback',
        googleSheets: hasSheetsWebhook ? 'connected' : 'unconfigured'
      },
      disclaimer: 'Educational & Demo Project - Not for official banking or financial decisions.'
    }
  });
});

/**
 * Core Financial Calculation Endpoints (Phase 2)
 */
router.post('/loan/check', validateLoanCheck, loanController.checkEligibility);
router.post('/emi/calculate', validateEmiCalculation, emiController.calculate);
router.post('/credit/analyze', validateCreditAnalysis, creditController.analyze);

/**
 * AI Financial Coaching Endpoint (Prepared for Phase 4)
 */
router.post('/ai/tips', validateAiTipsRequest, aiController.getFinancialTips);

/**
 * Assessment Submission & Retrieval Endpoints (Phase 5)
 */
router.get('/assessment/history', sheetsController.getHistory);
router.post('/assessment/submit', validateAssessmentSubmission, sheetsController.submitAssessment);

module.exports = router;
