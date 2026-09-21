/**
 * Loan Controller
 * Handles loan eligibility assessment API requests.
 */

const { evaluateLoanEligibility } = require('../services/loanService');

function checkEligibility(req, res, next) {
  try {
    const {
      monthlyIncome,
      existingEmi,
      requestedLoanAmount,
      tenureMonths,
      interestRate,
      creditScore,
      employmentType
    } = req.body;

    const result = evaluateLoanEligibility({
      monthlyIncome,
      existingEmi,
      requestedLoanAmount,
      tenureMonths,
      interestRate,
      creditScore,
      employmentType
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  checkEligibility
};
