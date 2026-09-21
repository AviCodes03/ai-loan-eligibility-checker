/**
 * Unit Tests for emiService
 * Standard reducing balance EMI formula and edge cases.
 */

const test = require('node:test');
const assert = require('node:assert');
const { calculateEmi, generateAmortizationSchedule } = require('../server/services/emiService');

test('EMI Calculation - Standard Benchmark (₹1,00,000 at 10% for 12 months)', () => {
  const res = calculateEmi(100000, 10, 12);
  assert.ok(Math.abs(res.monthlyEmi - 8791.59) < 0.1, `Expected EMI ~8791.59, got ${res.monthlyEmi}`);
  assert.ok(Math.abs(res.totalPayment - 105499.08) < 1.0, `Expected total ~105499.08, got ${res.totalPayment}`);
  assert.ok(Math.abs(res.totalInterest - 5499.08) < 1.0, `Expected interest ~5499.08, got ${res.totalInterest}`);
  assert.strictEqual(res.tenureMonths, 12);
  assert.strictEqual(res.annualInterestRate, 10);
});

test('EMI Calculation - Zero Interest Rate Handling', () => {
  const res = calculateEmi(60000, 0, 12);
  assert.strictEqual(res.monthlyEmi, 5000, 'With 0% interest, EMI must equal Principal / Tenure');
  assert.strictEqual(res.totalInterest, 0, 'Total interest must be 0');
  assert.strictEqual(res.totalPayment, 60000, 'Total payment must equal principal');
  assert.strictEqual(res.principalSharePct, 100);
  assert.strictEqual(res.interestSharePct, 0);
});

test('EMI Calculation - Minimum Tenure (1 Month)', () => {
  const res = calculateEmi(50000, 12, 1);
  assert.strictEqual(res.tenureMonths, 1);
  assert.strictEqual(res.monthlyEmi, 50500, '1 month at 12% p.a. (1% per month) should be 50,500');
  assert.strictEqual(res.totalInterest, 500);
});

test('EMI Calculation - Maximum Long Tenure (360 Months / 30 Years)', () => {
  const res = calculateEmi(2500000, 8.5, 360);
  assert.ok(res.monthlyEmi > 0);
  assert.ok(res.totalInterest > res.principal, 'Over 30 years at 8.5%, total interest should exceed principal');
});

test('EMI Calculation - Input Validation & Edge Errors', () => {
  assert.throws(() => calculateEmi(0, 10, 12), /Principal amount must be a positive number/);
  assert.throws(() => calculateEmi(-5000, 10, 12), /Principal amount must be a positive number/);
  assert.throws(() => calculateEmi(10000, 10, 0), /Tenure months must be a positive integer/);
  assert.throws(() => calculateEmi(10000, -2, 12), /Annual interest rate must be 0 or a positive number/);
});

test('Amortization Schedule Integrity', () => {
  const res = generateAmortizationSchedule(50000, 10, 6);
  assert.strictEqual(res.schedule.length, 6, 'Should generate exactly 6 monthly records');

  const firstMonth = res.schedule[0];
  assert.strictEqual(firstMonth.period, 1);
  assert.strictEqual(firstMonth.openingBalance, 50000);

  const lastMonth = res.schedule[5];
  assert.strictEqual(lastMonth.period, 6);
  assert.strictEqual(lastMonth.closingBalance, 0, 'Final loan balance must amortize to 0');

  const sumPrincipalPaid = res.schedule.reduce((acc, m) => acc + m.principalPaid, 0);
  assert.ok(Math.abs(sumPrincipalPaid - 50000) < 1.0, 'Sum of principal paid across all months must equal principal');
});
