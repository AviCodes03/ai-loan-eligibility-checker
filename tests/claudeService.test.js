/**
 * Unit Tests for Claude AI Integration Service & Fallback Engine
 * Tests: Valid response, missing key, API failure, timeout, rate limiting,
 * fallback activation, key scrubbing, and immutability of financial calculations.
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  generateFinancialTips,
  generateRuleBasedTips,
  callClaudeApi,
  buildUserPrompt,
  CLAUDE_SYSTEM_PROMPT
} = require('../server/services/claudeService');

const sampleProfile = {
  monthlyIncome: 75000,
  existingEmi: 10000,
  requestedLoanAmount: 800000,
  maxEligibleAmount: 1324768,
  calculatedEmi: 16607,
  foir: 35.5,
  dti: 13.3,
  creditScore: 750,
  creditTier: 'Excellent',
  status: 'Eligible',
  riskTier: 'Low',
  eligibilityScore: 90
};

test('Claude Service - Prompt Construction & System Prompt Integrity', () => {
  const prompt = buildUserPrompt(sampleProfile);
  assert.ok(prompt.includes('₹75,000'), 'User prompt must include formatted income');
  assert.ok(prompt.includes('35.5%'), 'User prompt must include FOIR');
  assert.ok(prompt.includes('750'), 'User prompt must include credit score');

  assert.ok(CLAUDE_SYSTEM_PROMPT.includes('EDUCATIONAL MENTOR ONLY'));
  assert.ok(CLAUDE_SYSTEM_PROMPT.includes('NEVER recalculate, override, contradict, or alter'));
});

test('Claude Service - Missing API Key Activates Deterministic Fallback', async () => {
  const savedKey = process.env.ANTHROPIC_API_KEY;
  try {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await generateFinancialTips(sampleProfile);

    assert.strictEqual(result.source, 'fallback', 'Source must be "fallback" when key is missing');
    assert.strictEqual(result.badge, 'Demo Rule-Based Guidance (Offline Fallback)');
    assert.ok(result.summary.length > 0);
    assert.ok(result.strengths.length > 0);
    assert.ok(result.risks.length > 0);
    assert.ok(result.recommendations.length > 0);
    assert.ok(result.disclaimer.includes('Educational demonstration guidance only'));
  } finally {
    process.env.ANTHROPIC_API_KEY = savedKey;
  }
});

test('Claude Service - Valid Claude API Mocked Response', async () => {
  const savedKey = process.env.ANTHROPIC_API_KEY;
  try {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-mock-key-for-test';

    const mockClient = {
      messages: {
        async create() {
          return {
            model: 'claude-3-5-sonnet-20241022',
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  summary: 'Your low debt-to-income ratio indicates strong financial health for retail borrowing.',
                  strengths: ['Healthy disposable income', 'Consistent payment track record'],
                  risks: ['Market interest rate volatility'],
                  recommendations: [
                    { title: 'Prepayment Planning', detail: 'Accelerate principal repayments.' },
                    { title: 'Emergency Buffer', detail: 'Hold 6 months EMI in liquid savings.' }
                  ],
                  disclaimer: 'Educational demonstration analysis provided by Claude AI.'
                })
              }
            ]
          };
        }
      }
    };

    const result = await generateFinancialTips(sampleProfile, mockClient);

    assert.strictEqual(result.source, 'claude', 'Source must be "claude" on successful call');
    assert.ok(result.badge.includes('Anthropic Claude'));
    assert.strictEqual(result.model, 'claude-3-5-sonnet-20241022');
    assert.ok(result.summary.includes('low debt-to-income ratio'));
    assert.strictEqual(result.strengths.length, 2);
    assert.strictEqual(result.risks.length, 1);
    assert.strictEqual(result.recommendations.length, 2);
  } finally {
    process.env.ANTHROPIC_API_KEY = savedKey;
  }
});

test('Claude Service - API Failure Triggers Fallback', async () => {
  const savedKey = process.env.ANTHROPIC_API_KEY;
  try {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-mock-key-for-test';

    const mockFailingClient = {
      messages: {
        async create() {
          throw new Error('Anthropic API connection error (HTTP 500)');
        }
      }
    };

    const result = await generateFinancialTips(sampleProfile, mockFailingClient);

    assert.strictEqual(result.source, 'fallback', 'Must gracefully fall back on API error');
    assert.strictEqual(result.badge, 'Demo Rule-Based Guidance (Offline Fallback)');
    assert.ok(result.recommendations.length > 0);
  } finally {
    process.env.ANTHROPIC_API_KEY = savedKey;
  }
});

test('Claude Service - API Timeout Triggers Fallback', async () => {
  const savedKey = process.env.ANTHROPIC_API_KEY;
  try {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-mock-key-for-test';

    const mockTimeoutClient = {
      messages: {
        async create() {
          const timeoutErr = new Error('Request timed out after 10000ms');
          timeoutErr.name = 'TimeoutError';
          throw timeoutErr;
        }
      }
    };

    const result = await generateFinancialTips(sampleProfile, mockTimeoutClient);

    assert.strictEqual(result.source, 'fallback');
    assert.strictEqual(result.badge, 'Demo Rule-Based Guidance (Offline Fallback)');
  } finally {
    process.env.ANTHROPIC_API_KEY = savedKey;
  }
});

test('Claude Service - Rate Limit Error (HTTP 429) Triggers Fallback', async () => {
  const savedKey = process.env.ANTHROPIC_API_KEY;
  try {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-mock-key-for-test';

    const mockRateLimitedClient = {
      messages: {
        async create() {
          const rateErr = new Error('Rate limit exceeded: 429 Too Many Requests');
          rateErr.status = 429;
          throw rateErr;
        }
      }
    };

    const result = await generateFinancialTips(sampleProfile, mockRateLimitedClient);

    assert.strictEqual(result.source, 'fallback');
    assert.strictEqual(result.badge, 'Demo Rule-Based Guidance (Offline Fallback)');
  } finally {
    process.env.ANTHROPIC_API_KEY = savedKey;
  }
});

test('Claude Service - API Key Never Appears in Result Output', async () => {
  const secretKey = 'sk-ant-api03-private-super-secret-key-1234567890';
  const savedKey = process.env.ANTHROPIC_API_KEY;

  try {
    process.env.ANTHROPIC_API_KEY = secretKey;

    const mockClient = {
      messages: {
        async create() {
          return {
            model: 'claude-3-5-sonnet-20241022',
            content: [{ type: 'text', text: JSON.stringify({ summary: 'Valid summary', recommendations: [] }) }]
          };
        }
      }
    };

    const result = await generateFinancialTips(sampleProfile, mockClient);
    const jsonString = JSON.stringify(result);

    assert.ok(!jsonString.includes(secretKey), 'Secret API key must NEVER appear anywhere in response JSON');
    assert.ok(!jsonString.includes('sk-ant-'), 'No key prefix should appear in response JSON');
  } finally {
    process.env.ANTHROPIC_API_KEY = savedKey;
  }
});

test('Claude Service - Cannot Modify Deterministic Calculations', async () => {
  const originalProfile = { ...sampleProfile };

  const result = await generateFinancialTips(originalProfile);

  // Result must NOT return or alter calculated financial fields
  assert.strictEqual(result.eligibilityScore, undefined, 'Claude service must not return eligibilityScore');
  assert.strictEqual(result.calculatedEmi, undefined, 'Claude service must not return calculatedEmi');
  assert.strictEqual(result.foir, undefined, 'Claude service must not return foir');
  assert.strictEqual(result.dti, undefined, 'Claude service must not return dti');
  assert.strictEqual(result.maxEligibleAmount, undefined, 'Claude service must not return maxEligibleAmount');

  // Input object must remain completely untouched
  assert.strictEqual(originalProfile.eligibilityScore, 90);
  assert.strictEqual(originalProfile.maxEligibleAmount, 1324768);
  assert.strictEqual(originalProfile.calculatedEmi, 16607);
  assert.strictEqual(originalProfile.status, 'Eligible');
});
