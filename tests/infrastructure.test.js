/**
 * Unit & Integration Tests for Phase 3 Backend Infrastructure
 * Tests: Centralized error handling, safe logging, CORS, and health endpoint.
 */

const test = require('node:test');
const assert = require('node:assert');
const AppError = require('../server/utils/AppError');
const { redactSensitiveData, SENSITIVE_KEYS } = require('../server/middleware/logger');
const getCorsOptions = require('../server/config/cors');
const { jsonSyntaxErrorHandler, notFoundHandler, errorHandler } = require('../server/middleware/errorHandler');
const { generateRuleBasedTips } = require('../server/services/claudeService');
const { formatAssessmentRow, submitToSheets } = require('../server/services/sheetsService');

test('Infrastructure - Safe Logger Redaction', () => {
  const dirtyPayload = {
    applicantName: 'Rahul Sharma',
    monthlyIncome: 60000,
    apiKey: 'secret-api-key-12345',
    token: 'bearer-token-abcde',
    nestedConfig: {
      password: 'mypassword',
      anthropic_api_key: 'sk-ant-sample-secret',
      validField: 'allowed'
    }
  };

  const sanitized = redactSensitiveData(dirtyPayload);

  assert.strictEqual(sanitized.applicantName, 'Rahul Sharma');
  assert.strictEqual(sanitized.monthlyIncome, 60000);
  assert.strictEqual(sanitized.apiKey, '[REDACTED]');
  assert.strictEqual(sanitized.token, '[REDACTED]');
  assert.strictEqual(sanitized.nestedConfig.password, '[REDACTED]');
  assert.strictEqual(sanitized.nestedConfig.anthropic_api_key, '[REDACTED]');
  assert.strictEqual(sanitized.nestedConfig.validField, 'allowed');
});

test('Infrastructure - AppError Custom Class', () => {
  const err = new AppError('Resource unavailable', 404, ['Item ID 10 not found']);
  assert.strictEqual(err.statusCode, 404);
  assert.strictEqual(err.status, 404);
  assert.strictEqual(err.message, 'Resource unavailable');
  assert.deepStrictEqual(err.details, ['Item ID 10 not found']);
  assert.strictEqual(err.isOperational, true);
});

test('Infrastructure - Centralized Error Handler JSON Syntax Error', () => {
  const syntaxErr = new SyntaxError('Unexpected token in JSON');
  syntaxErr.status = 400;
  syntaxErr.body = '{ bad json';

  let statusCode = 200;
  let responseData = null;
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  jsonSyntaxErrorHandler(syntaxErr, {}, mockRes, () => {});

  assert.strictEqual(statusCode, 400);
  assert.strictEqual(responseData.success, false);
  assert.ok(responseData.error.includes('Malformed JSON payload'));
});

test('Infrastructure - 404 Not Found Handler', () => {
  let statusCode = 200;
  let responseData = null;
  const mockReq = { method: 'GET', originalUrl: '/api/unknown-route' };
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  notFoundHandler(mockReq, mockRes);
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseData.success, false);
  assert.ok(responseData.error.includes('/api/unknown-route'));
});

test('Infrastructure - Error Handler Masks Exposed API Keys in Error Messages', () => {
  const exposedKeyErr = new Error('Anthropic call failed with key sk-ant-secret123456789_abcdef');
  let statusCode = 200;
  let responseData = null;
  const mockReq = { method: 'POST', originalUrl: '/api/ai/tips' };
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  errorHandler(exposedKeyErr, mockReq, mockRes, () => {});

  assert.strictEqual(statusCode, 500);
  assert.strictEqual(responseData.success, false);
  assert.ok(!responseData.error.includes('sk-ant-secret123456789_abcdef'), 'API key must not appear in response');
  assert.ok(responseData.error.includes('[REDACTED_API_KEY]'));
});

test('Infrastructure - CORS Configuration Handler', () => {
  const corsOptions = getCorsOptions();

  // Test no-origin request (e.g. static / curl)
  corsOptions.origin(null, (err, allow) => {
    assert.strictEqual(err, null);
    assert.strictEqual(allow, true);
  });

  // Test allowed localhost origin
  corsOptions.origin('http://localhost:3000', (err, allow) => {
    assert.strictEqual(err, null);
    assert.strictEqual(allow, true);
  });

  assert.deepStrictEqual(corsOptions.methods, ['GET', 'POST', 'OPTIONS']);
});

test('Infrastructure - Phase 4 AI Fallback Guidance Engine', () => {
  const tips = generateRuleBasedTips({
    monthlyIncome: 60000,
    requestedLoanAmount: 500000,
    creditScore: 740,
    foir: 32,
    status: 'Eligible'
  });

  assert.strictEqual(tips.source, 'fallback');
  assert.ok(tips.badge.includes('Offline Fallback'));
  assert.ok(tips.strengths.length >= 1);
  assert.ok(tips.risks.length >= 1);
  assert.ok(tips.recommendations.length >= 2);
  assert.ok(tips.disclaimer.includes('Educational demonstration guidance only'));
});

test('Infrastructure - Phase 5 Google Sheets Formatter & Unconfigured Handling', async () => {
  const row = formatAssessmentRow(
    { name: 'Priya Singh', email: 'priya@example.com' },
    {
      monthlyIncome: 75000,
      requestedLoanAmount: 800000,
      calculatedEmi: 16607,
      maxEligibleAmount: 1324768,
      status: 'Eligible',
      riskTier: 'Low',
      eligibilityScore: 90
    }
  );

  assert.strictEqual(row.applicantName, 'Priya Singh');
  assert.strictEqual(row.applicantEmail, 'priya@example.com');
  assert.strictEqual(row.monthlyIncome, 75000);
  assert.strictEqual(row.eligibilityScore, 90);

  // Without webhook configured, submitToSheets gracefully handles offline mode
  const submission = await submitToSheets({
    applicantName: 'Priya Singh',
    applicantEmail: 'priya@example.com',
    assessmentData: { monthlyIncome: 75000 }
  });

  assert.strictEqual(submission.stored, false);
  assert.ok(submission.message.includes('unconfigured'));
});
