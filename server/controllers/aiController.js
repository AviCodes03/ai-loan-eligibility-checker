/**
 * AI Controller
 * Manages financial coaching requests.
 */

const { generateFinancialTips } = require('../services/claudeService');

async function getFinancialTips(req, res, next) {
  try {
    const { profileSummary } = req.body;
    const tips = await generateFinancialTips(profileSummary);

    return res.json({
      success: true,
      data: tips
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getFinancialTips
};
