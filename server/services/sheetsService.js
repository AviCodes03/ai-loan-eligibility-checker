/**
 * Google Sheets Data Logging Service
 * Sends assessment records to Google Sheets via a Google Apps Script Webhook.
 * Maintains zero credential exposure and graceful offline/error handling.
 */

// In-memory dynamic assessment history cache (most recent 50 submissions)
const assessmentHistory = [];
const MAX_HISTORY = 50;

function getAssessmentHistory() {
  return [...assessmentHistory];
}

function clearAssessmentHistory() {
  assessmentHistory.length = 0;
}

/**
 * Formats assessment record into tabular columns for Google Sheets
 *
 * @param {object} applicant - Applicant info
 * @param {object} assessment - Deterministic calculation results
 * @returns {object} Formatted payload
 */
function formatAssessmentRow(applicant = {}, assessment = {}) {
  const source = assessment.loanResult || assessment || {};
  const input = assessment.input || source.input || {};

  return {
    timestamp: new Date().toISOString(),
    applicantName: applicant.name || 'Anonymous Demo Applicant',
    applicantEmail: applicant.email || 'N/A',
    monthlyIncome: Number(input.monthlyIncome || source.monthlyIncome || 0),
    requestedLoanAmount: Number(input.requestedLoanAmount || source.requestedLoanAmount || source.requestedAmount || 0),
    tenureMonths: Number(input.tenureMonths || source.tenureMonths || 0),
    interestRate: Number(input.interestRate || source.interestRate || 0),
    creditScore: Number(input.creditScore || source.creditScore || 0),
    calculatedEmi: Number(source.calculatedEmi || source.calculatedEMI || 0),
    maxEligibleAmount: Number(source.maxEligibleAmount || source.maxEligibleLoan || 0),
    status: source.status || 'N/A',
    riskTier: source.riskTier || 'N/A',
    eligibilityScore: Number(source.eligibilityScore || 0)
  };
}

/**
 * Submits assessment record to Google Sheets via Webhook
 *
 * @param {object} data - Submission payload { applicantName, applicantEmail, assessmentData }
 * @param {Function} [customFetch=null] - Optional fetch client for unit testing
 * @returns {Promise<object>} Persistence status
 */
async function submitToSheets(data = {}, customFetch = null) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const rowData = formatAssessmentRow(
    { name: data.applicantName, email: data.applicantEmail },
    data.assessmentData
  );

  // Dynamically record in server memory history log
  assessmentHistory.unshift({
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...rowData
  });
  if (assessmentHistory.length > MAX_HISTORY) {
    assessmentHistory.pop();
  }

  // 1. Unconfigured Webhook Handling
  if (!webhookUrl || webhookUrl.trim().length === 0) {
    return {
      stored: false,
      isConfigured: false,
      message: 'Google Sheets integration is unconfigured in server environment variables. Record captured in local session.',
      record: rowData
    };
  }

  // 2. Perform HTTP POST to Google Apps Script Webhook
  const fetchClient = customFetch || globalThis.fetch;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetchClient(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rowData),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // Google Apps Script Web Apps return 200 or 302 redirect to echo JSON
    if (response.ok || response.status === 302) {
      return {
        stored: true,
        isConfigured: true,
        message: 'Assessment successfully recorded to Google Sheets.',
        timestamp: rowData.timestamp,
        record: rowData
      };
    }

    console.warn(`[Google Sheets Notice] Webhook returned HTTP ${response.status}. Record saved in local session.`);
    return {
      stored: false,
      isConfigured: true,
      message: `Google Sheets service returned HTTP ${response.status}. Record saved in local session.`,
      record: rowData
    };
  } catch (err) {
    clearTimeout(timeoutId);

    const isTimeout = err.name === 'AbortError' || (err.message && err.message.includes('timeout'));
    const safeReason = isTimeout
      ? 'Webhook request timed out after 10 seconds'
      : 'Network connection error reaching webhook';

    // Log safe warning without leaking any private Webhook URL or tokens
    console.warn(`[Google Sheets Notice] ${safeReason}. Record saved in local session.`);

    return {
      stored: false,
      isConfigured: true,
      message: `${safeReason}. Record captured in local session.`,
      record: rowData
    };
  }
}

module.exports = {
  submitToSheets,
  formatAssessmentRow,
  getAssessmentHistory,
  clearAssessmentHistory
};
