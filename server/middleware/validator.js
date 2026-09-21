/**
 * Input Validation and Sanitization Middleware
 * Validates incoming request payloads for loan, credit, and EMI endpoints.
 */

const { VALIDATION_BOUNDS } = require('../config/constants');

/**
 * Strips potentially malicious script contents, HTML tags, and leading/trailing whitespace
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Validates that a value is a finite, non-negative number
 */
function isValidNumber(val, allowZero = false) {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) return false;
  return allowZero ? num >= 0 : num > 0;
}

/**
 * Validates loan eligibility input parameters
 */
function validateLoanCheck(req, res, next) {
  const {
    monthlyIncome,
    existingEmi = 0,
    requestedLoanAmount,
    tenureMonths,
    interestRate,
    creditScore
  } = req.body;

  const errors = [];

  if (!isValidNumber(monthlyIncome)) {
    errors.push('Monthly net income must be a positive number greater than 0.');
  }

  if (!isValidNumber(existingEmi, true)) {
    errors.push('Existing EMI must be zero or a positive number.');
  }

  if (!isValidNumber(requestedLoanAmount)) {
    errors.push('Requested loan amount must be a positive number.');
  } else if (requestedLoanAmount < VALIDATION_BOUNDS.MIN_LOAN_AMOUNT || requestedLoanAmount > VALIDATION_BOUNDS.MAX_LOAN_AMOUNT) {
    errors.push(`Loan amount must be between ₹${VALIDATION_BOUNDS.MIN_LOAN_AMOUNT.toLocaleString('en-IN')} and ₹${VALIDATION_BOUNDS.MAX_LOAN_AMOUNT.toLocaleString('en-IN')}.`);
  }

  if (!isValidNumber(tenureMonths)) {
    errors.push('Loan tenure in months must be a positive whole number.');
  } else {
    const months = Number(tenureMonths);
    if (!Number.isInteger(months) || months < VALIDATION_BOUNDS.MIN_TENURE_MONTHS || months > VALIDATION_BOUNDS.MAX_TENURE_MONTHS) {
      errors.push(`Tenure must be an integer between ${VALIDATION_BOUNDS.MIN_TENURE_MONTHS} and ${VALIDATION_BOUNDS.MAX_TENURE_MONTHS} months (up to 30 years).`);
    }
  }

  if (!isValidNumber(interestRate)) {
    errors.push('Annual interest rate must be a positive number.');
  } else if (interestRate < VALIDATION_BOUNDS.MIN_INTEREST_RATE || interestRate > VALIDATION_BOUNDS.MAX_INTEREST_RATE) {
    errors.push(`Interest rate must be between ${VALIDATION_BOUNDS.MIN_INTEREST_RATE}% and ${VALIDATION_BOUNDS.MAX_INTEREST_RATE}%.`);
  }

  if (!isValidNumber(creditScore)) {
    errors.push('Credit score must be a number.');
  } else {
    const score = Number(creditScore);
    if (score < VALIDATION_BOUNDS.MIN_CREDIT_SCORE || score > VALIDATION_BOUNDS.MAX_CREDIT_SCORE) {
      errors.push(`Credit score must be between ${VALIDATION_BOUNDS.MIN_CREDIT_SCORE} and ${VALIDATION_BOUNDS.MAX_CREDIT_SCORE}.`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Input validation failed. Please check the provided values.',
      details: errors
    });
  }

  // Sanitize and normalize body
  req.body.monthlyIncome = Number(monthlyIncome);
  req.body.existingEmi = Number(existingEmi);
  req.body.requestedLoanAmount = Number(requestedLoanAmount);
  req.body.tenureMonths = Math.round(Number(tenureMonths));
  req.body.interestRate = Number(interestRate);
  req.body.creditScore = Math.round(Number(creditScore));
  if (req.body.employmentType) {
    req.body.employmentType = sanitizeString(req.body.employmentType);
  }

  next();
}

/**
 * Validates EMI calculation input parameters
 */
function validateEmiCalculation(req, res, next) {
  const { principal, annualInterestRate, tenureMonths } = req.body;
  const errors = [];

  if (!isValidNumber(principal)) {
    errors.push('Principal loan amount must be a positive number.');
  }

  if (!isValidNumber(annualInterestRate, true)) {
    errors.push('Annual interest rate must be zero or a positive percentage.');
  }

  if (!isValidNumber(tenureMonths)) {
    errors.push('Tenure in months must be a positive integer.');
  } else if (!Number.isInteger(Number(tenureMonths)) || Number(tenureMonths) < 1 || Number(tenureMonths) > 360) {
    errors.push('Tenure must be between 1 and 360 months.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid EMI calculation parameters.',
      details: errors
    });
  }

  req.body.principal = Number(principal);
  req.body.annualInterestRate = Number(annualInterestRate);
  req.body.tenureMonths = Math.round(Number(tenureMonths));

  next();
}

/**
 * Validates credit score analysis parameters
 */
function validateCreditAnalysis(req, res, next) {
  const { creditScore } = req.body;
  const errors = [];

  if (!isValidNumber(creditScore)) {
    errors.push('Credit score must be provided as a number.');
  } else {
    const score = Number(creditScore);
    if (score < VALIDATION_BOUNDS.MIN_CREDIT_SCORE || score > VALIDATION_BOUNDS.MAX_CREDIT_SCORE) {
      errors.push(`Credit score must be within standard range (${VALIDATION_BOUNDS.MIN_CREDIT_SCORE} - ${VALIDATION_BOUNDS.MAX_CREDIT_SCORE}).`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid credit analysis parameters.',
      details: errors
    });
  }

  req.body.creditScore = Math.round(Number(creditScore));
  next();
}

/**
 * Validates AI tips request payload (Prepares for Phase 4)
 */
function validateAiTipsRequest(req, res, next) {
  const { profileSummary } = req.body;
  const errors = [];

  if (!profileSummary || typeof profileSummary !== 'object') {
    errors.push('profileSummary object must be provided in the request body.');
  } else {
    if (!isValidNumber(profileSummary.monthlyIncome)) {
      errors.push('profileSummary.monthlyIncome must be a valid positive number.');
    }
    if (!isValidNumber(profileSummary.requestedLoanAmount)) {
      errors.push('profileSummary.requestedLoanAmount must be a valid positive number.');
    }
    if (!isValidNumber(profileSummary.creditScore)) {
      errors.push('profileSummary.creditScore must be a valid credit score.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid AI coaching request payload.',
      details: errors
    });
  }

  // Sanitize any text fields
  if (profileSummary.status) profileSummary.status = sanitizeString(profileSummary.status);
  if (profileSummary.riskTier) profileSummary.riskTier = sanitizeString(profileSummary.riskTier);

  next();
}

/**
 * Validates Google Sheets assessment submission payload (Prepares for Phase 5)
 */
function validateAssessmentSubmission(req, res, next) {
  const { applicantName, applicantEmail, assessmentData } = req.body;
  const errors = [];

  if (!applicantName || typeof applicantName !== 'string' || applicantName.trim().length === 0) {
    errors.push('Applicant name or demo alias is required.');
  }

  if (!assessmentData || typeof assessmentData !== 'object') {
    errors.push('Assessment data object is required.');
  }

  if (applicantEmail && typeof applicantEmail === 'string' && applicantEmail.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicantEmail.trim())) {
      errors.push('Applicant email format is invalid.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid assessment submission payload.',
      details: errors
    });
  }

  req.body.applicantName = sanitizeString(applicantName);
  if (applicantEmail) req.body.applicantEmail = sanitizeString(applicantEmail);

  next();
}

module.exports = {
  sanitizeString,
  isValidNumber,
  validateLoanCheck,
  validateEmiCalculation,
  validateCreditAnalysis,
  validateAiTipsRequest,
  validateAssessmentSubmission
};
