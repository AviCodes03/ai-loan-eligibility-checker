/**
 * EMI Controller
 * Handles EMI and amortization schedule API requests.
 */

const { generateAmortizationSchedule } = require('../services/emiService');

function calculate(req, res, next) {
  try {
    const { principal, annualInterestRate, tenureMonths } = req.body;

    const result = generateAmortizationSchedule(principal, annualInterestRate, tenureMonths);

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  calculate
};
