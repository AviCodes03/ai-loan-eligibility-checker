/**
 * Credit Controller
 * Handles credit score factor analysis API requests.
 */

const { analyzeCreditProfile } = require('../services/creditService');

function analyze(req, res, next) {
  try {
    const {
      creditScore,
      onTimePaymentPct,
      creditUtilizationPct,
      creditHistoryMonths,
      activeLoansCount,
      recentInquiriesCount
    } = req.body;

    const result = analyzeCreditProfile({
      creditScore,
      onTimePaymentPct,
      creditUtilizationPct,
      creditHistoryMonths,
      activeLoansCount,
      recentInquiriesCount
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
  analyze
};
