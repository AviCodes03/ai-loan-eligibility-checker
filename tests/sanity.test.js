/**
 * Phase 1 Sanity & Baseline Test Suite
 * Executed with Node.js built-in test runner: node --test tests/sanity.test.js
 */

const test = require('node:test');
const assert = require('node:assert');
const { FOIR_LIMITS, VALIDATION_BOUNDS } = require('../server/config/constants');
const { isValidNumber, sanitizeString } = require('../server/middleware/validator');

test('Financial Constants Integrity', () => {
  assert.strictEqual(FOIR_LIMITS.LOW_INCOME_FOIR, 0.40, 'Low income FOIR should be 40%');
  assert.strictEqual(FOIR_LIMITS.MID_INCOME_FOIR, 0.50, 'Mid income FOIR should be 50%');
  assert.strictEqual(FOIR_LIMITS.HIGH_INCOME_FOIR, 0.60, 'High income FOIR should be 60%');
  assert.strictEqual(VALIDATION_BOUNDS.MIN_CREDIT_SCORE, 300, 'Min credit score should be 300');
  assert.strictEqual(VALIDATION_BOUNDS.MAX_CREDIT_SCORE, 900, 'Max credit score should be 900');
});

test('Input Sanitization & Validation Middleware Functions', () => {
  // sanitizeString
  const dirty = '<script>alert("hack")</script>Salaried';
  assert.strictEqual(sanitizeString(dirty), 'Salaried', 'Should strip HTML tags');

  // isValidNumber
  assert.strictEqual(isValidNumber('5000'), true, 'Positive string number should be valid');
  assert.strictEqual(isValidNumber(5000), true, 'Positive number should be valid');
  assert.strictEqual(isValidNumber(0, false), false, 'Zero should be invalid when allowZero=false');
  assert.strictEqual(isValidNumber(0, true), true, 'Zero should be valid when allowZero=true');
  assert.strictEqual(isValidNumber(-100), false, 'Negative number should be invalid');
  assert.strictEqual(isValidNumber('abc'), false, 'Non-numeric string should be invalid');
  assert.strictEqual(isValidNumber(NaN), false, 'NaN should be invalid');
  assert.strictEqual(isValidNumber(null), false, 'Null should be invalid');
});

test('Standard Reducing Balance EMI Formula Precision Check', () => {
  // Test case: $100,000 principal, 10% annual interest, 12 months tenure
  const principal = 100000;
  const annualRate = 10;
  const tenureMonths = 12;

  const monthlyRate = (annualRate / 100) / 12;
  const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);

  // Standard banking EMI for 100k at 10% for 12 mos is ~8791.59
  assert.ok(Math.abs(emi - 8791.59) < 0.1, `Expected EMI ~8791.59, got ${emi.toFixed(2)}`);

  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;
  assert.ok(totalInterest > 0, 'Total interest should be positive');
  assert.ok(totalPayment > principal, 'Total payment should exceed principal');
});
