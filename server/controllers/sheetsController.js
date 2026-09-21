/**
 * Google Sheets Controller
 * Handles assessment persistence requests.
 */

const { submitToSheets } = require('../services/sheetsService');

async function submitAssessment(req, res, next) {
  try {
    const { applicantName, applicantEmail, assessmentData } = req.body;
    const result = await submitToSheets({
      applicantName,
      applicantEmail,
      assessmentData
    });

    return res.json({
      success: result.stored,
      data: result,
      message: result.message
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  submitAssessment
};
