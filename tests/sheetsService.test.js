/**
 * Unit Tests for Google Sheets Integration Service
 * Tests: Payload formatting, valid submission, missing webhook URL,
 * webhook failure (500), network timeout, and URL leakage prevention.
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  formatAssessmentRow,
  submitToSheets,
  getAssessmentHistory,
  clearAssessmentHistory
} = require('../server/services/sheetsService');

const mockAssessmentData = {
  monthlyIncome: 85000,
  existingEmi: 15000,
  requestedLoanAmount: 1200000,
  calculatedEmi: 24628,
  maxEligibleAmount: 1845000,
  status: 'Eligible',
  riskTier: 'Low',
  eligibilityScore: 92,
  input: {
    monthlyIncome: 85000,
    requestedLoanAmount: 1200000,
    tenureMonths: 60,
    interestRate: 8.5,
    creditScore: 780
  }
};

test('Sheets Service - Correctly Formatted Sheets Payload Structure', () => {
  const row = formatAssessmentRow(
    { name: 'Aditi Rao', email: 'aditi@example.com' },
    mockAssessmentData
  );

  assert.strictEqual(row.applicantName, 'Aditi Rao');
  assert.strictEqual(row.applicantEmail, 'aditi@example.com');
  assert.strictEqual(row.monthlyIncome, 85000);
  assert.strictEqual(row.requestedLoanAmount, 1200000);
  assert.strictEqual(row.tenureMonths, 60);
  assert.strictEqual(row.interestRate, 8.5);
  assert.strictEqual(row.creditScore, 780);
  assert.strictEqual(row.calculatedEmi, 24628);
  assert.strictEqual(row.maxEligibleAmount, 1845000);
  assert.strictEqual(row.status, 'Eligible');
  assert.strictEqual(row.riskTier, 'Low');
  assert.strictEqual(row.eligibilityScore, 92);
  assert.ok(row.timestamp.includes('T'), 'Timestamp must be ISO string');
});

test('Sheets Service - Missing Webhook Configuration Gracefully Handled', async () => {
  const savedUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  try {
    delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    const result = await submitToSheets({
      applicantName: 'Test Student',
      applicantEmail: 'student@example.com',
      assessmentData: mockAssessmentData
    });

    assert.strictEqual(result.stored, false);
    assert.strictEqual(result.isConfigured, false);
    assert.ok(result.message.includes('unconfigured'));
    assert.ok(result.record.applicantName, 'Test Student');
  } finally {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = savedUrl;
  }
});

test('Sheets Service - Valid Assessment Submission with Mock Fetch', async () => {
  const savedUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  try {
    const mockWebhookUrl = 'https://script.google.com/macros/s/AKfycbz_mock_script_id/exec';
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = mockWebhookUrl;

    let receivedUrl = '';
    let receivedPayload = null;

    const mockFetch = async (url, options) => {
      receivedUrl = url;
      receivedPayload = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        async json() {
          return { success: true, message: 'Row appended' };
        }
      };
    };

    const result = await submitToSheets({
      applicantName: 'Vikram Mehta',
      applicantEmail: 'vikram@example.com',
      assessmentData: mockAssessmentData
    }, mockFetch);

    assert.strictEqual(result.stored, true);
    assert.strictEqual(result.isConfigured, true);
    assert.ok(result.message.includes('successfully recorded'));
    assert.strictEqual(receivedUrl, mockWebhookUrl);
    assert.strictEqual(receivedPayload.applicantName, 'Vikram Mehta');
    assert.strictEqual(receivedPayload.monthlyIncome, 85000);
  } finally {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = savedUrl;
  }
});

test('Sheets Service - Webhook Non-200 Failure Handled Without Crashing', async () => {
  const savedUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  try {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/mock-error-endpoint/exec';

    const mockFailingFetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const result = await submitToSheets({
      applicantName: 'Failing Submission',
      assessmentData: mockAssessmentData
    }, mockFailingFetch);

    assert.strictEqual(result.stored, false);
    assert.strictEqual(result.isConfigured, true);
    assert.ok(result.message.includes('HTTP 500'));
  } finally {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = savedUrl;
  }
});

test('Sheets Service - Network Timeout Handled Gracefully', async () => {
  const savedUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  try {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/mock-timeout/exec';

    const mockTimeoutFetch = async () => {
      const timeoutErr = new Error('The operation was aborted due to timeout');
      timeoutErr.name = 'AbortError';
      throw timeoutErr;
    };

    const result = await submitToSheets({
      applicantName: 'Timeout Applicant',
      assessmentData: mockAssessmentData
    }, mockTimeoutFetch);

    assert.strictEqual(result.stored, false);
    assert.strictEqual(result.isConfigured, true);
    assert.ok(result.message.includes('timed out'));
  } finally {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = savedUrl;
  }
});

test('Sheets Service - Webhook URL Leakage Prevention', async () => {
  const privateMacroUrl = 'https://script.google.com/macros/s/AKfycbz_CONFIDENTIAL_KEY_99999/exec';
  const savedUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  try {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = privateMacroUrl;

    const mockFetch = async () => ({ ok: true, status: 200 });

    const result = await submitToSheets({
      applicantName: 'Privacy Check',
      assessmentData: mockAssessmentData
    }, mockFetch);

    const json = JSON.stringify(result);

    assert.ok(!json.includes('AKfycbz_CONFIDENTIAL_KEY_99999'), 'Private webhook URL must NEVER leak in client response');
    assert.ok(!json.includes('macros/s/'), 'Webhook endpoint path must not appear in response');
  } finally {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = savedUrl;
  }
});

test('Sheets Service - Dynamic In-Memory Assessment History Storage and Retrieval', async () => {
  clearAssessmentHistory();
  assert.strictEqual(getAssessmentHistory().length, 0);

  await submitToSheets({
    applicantName: 'Ananya Roy',
    applicantEmail: 'ananya@example.com',
    assessmentData: { monthlyIncome: 90000, requestedLoanAmount: 600000, status: 'Eligible' }
  });

  const history = getAssessmentHistory();
  assert.strictEqual(history.length, 1);
  assert.strictEqual(history[0].applicantName, 'Ananya Roy');
  assert.strictEqual(history[0].monthlyIncome, 90000);
  assert.ok(history[0].id.startsWith('rec_'));
});
