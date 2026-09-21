/**
 * Unit Tests for creditService
 * Credit score tier categorization and 5-factor weighted health analysis.
 */

const test = require('node:test');
const assert = require('node:assert');
const { analyzeCreditProfile } = require('../server/services/creditService');

test('Credit Score Analyzer - Score Tiers Mapping', () => {
  const excellent = analyzeCreditProfile({ creditScore: 820 });
  assert.strictEqual(excellent.scoreTier, 'Excellent');
  assert.strictEqual(excellent.riskLevel, 'Low');

  const good = analyzeCreditProfile({ creditScore: 720 });
  assert.strictEqual(good.scoreTier, 'Good');

  const fair = analyzeCreditProfile({ creditScore: 680 });
  assert.strictEqual(fair.scoreTier, 'Fair / Moderate');

  const poor = analyzeCreditProfile({ creditScore: 610 });
  assert.strictEqual(poor.scoreTier, 'Poor');

  const critical = analyzeCreditProfile({ creditScore: 400 });
  assert.strictEqual(critical.scoreTier, 'Critical / High Risk');
});

test('Credit Score Analyzer - Boundary Values (300 and 900)', () => {
  const minScore = analyzeCreditProfile({ creditScore: 300 });
  assert.strictEqual(minScore.creditScore, 300);

  const maxScore = analyzeCreditProfile({ creditScore: 900 });
  assert.strictEqual(maxScore.creditScore, 900);
});

test('Credit Score Analyzer - Out-of-bounds Rejection', () => {
  assert.throws(() => analyzeCreditProfile({ creditScore: 299 }), /Credit score must be an integer between 300 and 900/);
  assert.throws(() => analyzeCreditProfile({ creditScore: 901 }), /Credit score must be an integer between 300 and 900/);
  assert.throws(() => analyzeCreditProfile({ creditScore: 'invalid' }), /Credit score must be an integer/);
});

test('Credit Score Analyzer - 5 Weighted Factors Structure', () => {
  const result = analyzeCreditProfile({
    creditScore: 750,
    onTimePaymentPct: 98,
    creditUtilizationPct: 25,
    creditHistoryMonths: 36,
    activeLoansCount: 3,
    recentInquiriesCount: 1
  });

  assert.strictEqual(result.factorBreakdown.length, 5);

  const totalWeight = result.factorBreakdown.reduce((sum, f) => sum + f.weight, 0);
  assert.strictEqual(totalWeight, 100, 'Sum of factor weights must equal 100%');

  assert.ok(result.healthIndex >= 0 && result.healthIndex <= 100, 'Health index must be between 0 and 100');
  assert.ok(result.recommendations.length >= 1, 'Must return educational recommendations');
  assert.ok(result.disclaimer.includes('Educational demonstration model only'), 'Must contain non-proprietary disclaimer');
});
