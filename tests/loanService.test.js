/**
 * Unit Tests for loanService
 * Deterministic eligibility rules, FOIR/DTI, and edge cases.
 */

const test = require('node:test');
const assert = require('node:assert');
const { evaluateLoanEligibility } = require('../server/services/loanService');

test('Loan Eligibility - Standard Prime Applicant (Eligible)', () => {
  const result = evaluateLoanEligibility({
    monthlyIncome: 100000,
    existingEmi: 10000,
    requestedLoanAmount: 1000000,
    tenureMonths: 60,
    interestRate: 8.5,
    creditScore: 780,
    employmentType: 'Salaried'
  });

  assert.strictEqual(result.isEligible, true);
  assert.strictEqual(result.status, 'Eligible');
  assert.ok(result.eligibilityScore >= 70, `Expected score >= 70, got ${result.eligibilityScore}`);
  assert.ok(result.maxEligibleAmount >= 1000000, 'Max eligible amount should comfortably cover request');
  assert.ok(result.reasons.length >= 3, 'Must provide clear itemized reasons');
  assert.strictEqual(result.creditTier, 'Excellent');
});

test('Loan Eligibility - Over-leveraged Applicant (Ineligible)', () => {
  const result = evaluateLoanEligibility({
    monthlyIncome: 40000,
    existingEmi: 28000, // 70% current FOIR, exceeding 50% max
    requestedLoanAmount: 500000,
    tenureMonths: 36,
    interestRate: 10,
    creditScore: 720
  });

  assert.strictEqual(result.isEligible, false);
  assert.strictEqual(result.status, 'Ineligible');
  assert.ok(result.riskTier.includes('Over-leveraged'));
  assert.ok(result.reasons.some((r) => r.includes('Existing debt obligations')));
});

test('Loan Eligibility - Critical Low Credit Score (Ineligible)', () => {
  const result = evaluateLoanEligibility({
    monthlyIncome: 80000,
    existingEmi: 5000,
    requestedLoanAmount: 200000,
    tenureMonths: 24,
    interestRate: 9,
    creditScore: 480 // Below 550 minimum threshold
  });

  assert.strictEqual(result.isEligible, false);
  assert.strictEqual(result.status, 'Ineligible');
  assert.ok(result.reasons.some((r) => r.includes('Critical range')));
});

test('Loan Eligibility - Moderate Credit & High FOIR (Conditionally Eligible)', () => {
  const result = evaluateLoanEligibility({
    monthlyIncome: 50000,
    existingEmi: 15000,
    requestedLoanAmount: 1500000, // High loan pushing FOIR over 50%
    tenureMonths: 48,
    interestRate: 10.5,
    creditScore: 630
  });

  assert.strictEqual(result.isEligible, true);
  assert.strictEqual(result.status, 'Conditionally Eligible');
  assert.ok(result.reasons.some((r) => r.includes('reduced principal') || r.includes('co-applicant')));
});

test('Loan Eligibility - Zero Existing Obligations', () => {
  const result = evaluateLoanEligibility({
    monthlyIncome: 60000,
    existingEmi: 0,
    requestedLoanAmount: 500000,
    tenureMonths: 60,
    interestRate: 8.5,
    creditScore: 750
  });

  assert.strictEqual(result.existingEmi, 0);
  assert.strictEqual(result.dti, 0);
  assert.strictEqual(result.isEligible, true);
  assert.ok(result.eligibilityScore >= 75);
});

test('Loan Eligibility - Score Bounds and Educational Notice Check', () => {
  const result = evaluateLoanEligibility({
    monthlyIncome: 50000,
    existingEmi: 5000,
    requestedLoanAmount: 300000,
    tenureMonths: 36,
    interestRate: 9,
    creditScore: 700
  });

  assert.ok(result.eligibilityScore >= 0 && result.eligibilityScore <= 100, 'Score must be between 0 and 100');
  assert.ok(result.reasons.some((r) => r.includes('transparent demo formulas')), 'Must include demo disclaimer reason');
});

test('Loan Eligibility - Underage Applicant (< 21 years old -> Ineligible)', () => {
  const result = evaluateLoanEligibility({
    monthlyIncome: 80000,
    existingEmi: 0,
    requestedLoanAmount: 300000,
    tenureMonths: 36,
    interestRate: 8.5,
    creditScore: 760,
    age: 19
  });

  assert.strictEqual(result.isEligible, false);
  assert.strictEqual(result.status, 'Ineligible');
  assert.strictEqual(result.applicantAge, 19);
  assert.ok(result.riskTier.includes('Age Criteria'));
  assert.ok(result.reasons.some((r) => r.includes('below the demo primary borrower threshold of 21 years')));
});

test('Loan Eligibility - Maturity Past Retirement (> 65 years -> Conditionally Eligible)', () => {
  const result = evaluateLoanEligibility({
    monthlyIncome: 120000,
    existingEmi: 5000,
    requestedLoanAmount: 500000,
    tenureMonths: 60, // 5 years tenure + 62 years = 67 years maturity
    interestRate: 8.5,
    creditScore: 780,
    age: 62
  });

  assert.strictEqual(result.isEligible, true);
  assert.strictEqual(result.status, 'Conditionally Eligible');
  assert.strictEqual(result.applicantAge, 62);
  assert.ok(result.reasons.some((r) => r.includes('surpassing the demo retirement benchmark of 65 years')));
});

test('Loan Eligibility - Prime Working Age Applicant (21-60 years -> Eligible)', () => {
  const result = evaluateLoanEligibility({
    monthlyIncome: 95000,
    existingEmi: 8000,
    requestedLoanAmount: 600000,
    tenureMonths: 48,
    interestRate: 8.5,
    creditScore: 750,
    age: 32
  });

  assert.strictEqual(result.isEligible, true);
  assert.strictEqual(result.status, 'Eligible');
  assert.strictEqual(result.applicantAge, 32);
});
