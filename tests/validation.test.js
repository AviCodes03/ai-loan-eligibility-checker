/**
 * Unit Tests for Input Validation Middleware
 * Validates request payload boundary checks and sanitization.
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  validateLoanCheck,
  validateEmiCalculation,
  validateCreditAnalysis
} = require('../server/middleware/validator');

function createMockReqRes(body) {
  const req = { body };
  let statusCode = 200;
  let jsonResponse = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  return { req, res, next, getResult: () => ({ statusCode, jsonResponse, nextCalled }) };
}

test('Validator - Loan Check Valid Payload', () => {
  const { req, res, next, getResult } = createMockReqRes({
    monthlyIncome: 60000,
    existingEmi: 5000,
    requestedLoanAmount: 500000,
    tenureMonths: 60,
    interestRate: 8.5,
    creditScore: 750,
    employmentType: 'Salaried'
  });

  validateLoanCheck(req, res, next);
  const { nextCalled } = getResult();
  assert.strictEqual(nextCalled, true, 'Valid payload should pass to next middleware');
});

test('Validator - Loan Check Missing & Invalid Fields', () => {
  const { req, res, next, getResult } = createMockReqRes({
    monthlyIncome: -5000, // Invalid negative
    requestedLoanAmount: 'abc', // Invalid string
    tenureMonths: 0, // Out of range
    interestRate: 60, // Exceeds 50% limit
    creditScore: 200 // Below 300
  });

  validateLoanCheck(req, res, next);
  const { statusCode, jsonResponse, nextCalled } = getResult();
  assert.strictEqual(nextCalled, false, 'Invalid payload must not pass');
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(jsonResponse.success, false);
  assert.ok(jsonResponse.details.length >= 4, 'Should detail all validation failures');
});

test('Validator - EMI Calculation Parameters', () => {
  const validMock = createMockReqRes({ principal: 200000, annualInterestRate: 9, tenureMonths: 24 });
  validateEmiCalculation(validMock.req, validMock.res, validMock.next);
  assert.strictEqual(validMock.getResult().nextCalled, true);

  const invalidMock = createMockReqRes({ principal: -100, annualInterestRate: -5, tenureMonths: 400 });
  validateEmiCalculation(invalidMock.req, invalidMock.res, invalidMock.next);
  assert.strictEqual(invalidMock.getResult().statusCode, 400);
});

test('Validator - Credit Score Bounds', () => {
  const validMock = createMockReqRes({ creditScore: 700 });
  validateCreditAnalysis(validMock.req, validMock.res, validMock.next);
  assert.strictEqual(validMock.getResult().nextCalled, true);

  const invalidMock = createMockReqRes({ creditScore: 950 });
  validateCreditAnalysis(invalidMock.req, invalidMock.res, invalidMock.next);
  assert.strictEqual(invalidMock.getResult().statusCode, 400);
});

test('Validator - Applicant Age Bounds in Loan Check', () => {
  // Valid age within 18 to 100
  const validMock = createMockReqRes({
    monthlyIncome: 70000,
    existingEmi: 10000,
    requestedLoanAmount: 400000,
    tenureMonths: 36,
    interestRate: 8.5,
    creditScore: 720,
    age: 28
  });
  validateLoanCheck(validMock.req, validMock.res, validMock.next);
  assert.strictEqual(validMock.getResult().nextCalled, true);
  assert.strictEqual(validMock.req.body.age, 28);

  // Invalid underage (< 18)
  const underageMock = createMockReqRes({
    monthlyIncome: 70000,
    existingEmi: 10000,
    requestedLoanAmount: 400000,
    tenureMonths: 36,
    interestRate: 8.5,
    creditScore: 720,
    age: 16
  });
  validateLoanCheck(underageMock.req, underageMock.res, underageMock.next);
  assert.strictEqual(underageMock.getResult().statusCode, 400);
  assert.ok(underageMock.getResult().jsonResponse.details.some(d => d.toLowerCase().includes('age')));

  // Invalid over-max (> 100)
  const overageMock = createMockReqRes({
    monthlyIncome: 70000,
    existingEmi: 10000,
    requestedLoanAmount: 400000,
    tenureMonths: 36,
    interestRate: 8.5,
    creditScore: 720,
    age: 110
  });
  validateLoanCheck(overageMock.req, overageMock.res, overageMock.next);
  assert.strictEqual(overageMock.getResult().statusCode, 400);
});
