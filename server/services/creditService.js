/**
 * Credit Score Analysis Service
 * Educational model evaluating simulated credit factors.
 * Note: Does not claim to reproduce CIBIL, Experian, Equifax, or any proprietary bureau algorithm.
 */

const { CREDIT_SCORE_TIERS, VALIDATION_BOUNDS } = require('../config/constants');

/**
 * Analyzes credit score and factor breakdown for educational demonstration
 *
 * @param {object} params
 * @param {number} params.creditScore - Simulated credit score (300 - 900)
 * @param {number} [params.onTimePaymentPct=100] - Percentage of on-time payments (0-100)
 * @param {number} [params.creditUtilizationPct=30] - Revolving credit utilization percentage (0-100)
 * @param {number} [params.creditHistoryMonths=24] - Age of oldest active account in months
 * @param {number} [params.activeLoansCount=2] - Number of active credit lines
 * @param {number} [params.recentInquiriesCount=0] - Number of hard inquiries in last 6 months
 * @returns {object} Credit health assessment details
 */
function analyzeCreditProfile({
  creditScore,
  onTimePaymentPct = 100,
  creditUtilizationPct = 30,
  creditHistoryMonths = 24,
  activeLoansCount = 2,
  recentInquiriesCount = 0
}) {
  const score = Math.round(Number(creditScore));

  if (!Number.isFinite(score) || score < VALIDATION_BOUNDS.MIN_CREDIT_SCORE || score > VALIDATION_BOUNDS.MAX_CREDIT_SCORE) {
    throw new Error(`Credit score must be an integer between ${VALIDATION_BOUNDS.MIN_CREDIT_SCORE} and ${VALIDATION_BOUNDS.MAX_CREDIT_SCORE}.`);
  }

  // 1. Identify Demo Tier
  let tierInfo = CREDIT_SCORE_TIERS.CRITICAL;
  if (score >= CREDIT_SCORE_TIERS.EXCELLENT.min) {
    tierInfo = CREDIT_SCORE_TIERS.EXCELLENT;
  } else if (score >= CREDIT_SCORE_TIERS.GOOD.min) {
    tierInfo = CREDIT_SCORE_TIERS.GOOD;
  } else if (score >= CREDIT_SCORE_TIERS.FAIR.min) {
    tierInfo = CREDIT_SCORE_TIERS.FAIR;
  } else if (score >= CREDIT_SCORE_TIERS.POOR.min) {
    tierInfo = CREDIT_SCORE_TIERS.POOR;
  } else {
    tierInfo = CREDIT_SCORE_TIERS.CRITICAL;
  }

  // 2. Evaluate 5 Weighted Educational Factors
  const factors = [];
  const recommendations = [];

  // Factor 1: Payment History (35% Weight)
  let paymentScore = 0;
  let paymentStatus = 'Needs Work';
  let paymentDetail = '';
  if (onTimePaymentPct >= 99) {
    paymentScore = 100;
    paymentStatus = 'Good';
    paymentDetail = 'Exceptional on-time payment track record (99%-100%).';
  } else if (onTimePaymentPct >= 95) {
    paymentScore = 80;
    paymentStatus = 'Moderate';
    paymentDetail = 'Occasional delayed payment observed; maintain consistent auto-pay.';
    recommendations.push('Set up automated bill payments to prevent minor delays from impacting your score.');
  } else {
    paymentScore = 40;
    paymentStatus = 'Critical';
    paymentDetail = 'Frequent missed payments significantly depress credit eligibility.';
    recommendations.push('Prioritize bringing all past-due accounts current immediately.');
  }
  factors.push({
    name: 'Payment History',
    weight: 35,
    score: paymentScore,
    status: paymentStatus,
    detail: paymentDetail
  });

  // Factor 2: Credit Utilization (30% Weight)
  let utilScore = 0;
  let utilStatus = 'Needs Work';
  let utilDetail = '';
  if (creditUtilizationPct <= 30) {
    utilScore = 100;
    utilStatus = 'Good';
    utilDetail = `Low credit utilization (${creditUtilizationPct}%), well within the ideal < 30% threshold.`;
  } else if (creditUtilizationPct <= 50) {
    utilScore = 65;
    utilStatus = 'Moderate';
    utilDetail = `Moderate utilization (${creditUtilizationPct}%). Keeping it under 30% yields score gains.`;
    recommendations.push('Pay down credit card balances before the statement closing date to reduce reported utilization below 30%.');
  } else {
    utilScore = 30;
    utilStatus = 'Critical';
    utilDetail = `High utilization (${creditUtilizationPct}%) indicates potential over-reliance on revolving debt.`;
    recommendations.push('Avoid maxing out credit limits; consider requesting a credit limit increase without increasing spending.');
  }
  factors.push({
    name: 'Credit Utilization Ratio',
    weight: 30,
    score: utilScore,
    status: utilStatus,
    detail: utilDetail
  });

  // Factor 3: Credit History Length (15% Weight)
  let historyScore = 0;
  let historyStatus = 'Needs Work';
  let historyDetail = '';
  if (creditHistoryMonths >= 48) {
    historyScore = 100;
    historyStatus = 'Good';
    historyDetail = `Established history of ${(creditHistoryMonths / 12).toFixed(1)} years demonstrates borrower reliability.`;
  } else if (creditHistoryMonths >= 24) {
    historyScore = 75;
    historyStatus = 'Moderate';
    historyDetail = `Moderate account age (${(creditHistoryMonths / 12).toFixed(1)} years). Maturity will build over time.`;
  } else {
    historyScore = 50;
    historyStatus = 'Moderate';
    historyDetail = 'Relatively short credit history. Avoid closing older credit accounts.';
    recommendations.push('Keep your oldest credit card active with small occasional transactions to preserve account age.');
  }
  factors.push({
    name: 'Credit History Length',
    weight: 15,
    score: historyScore,
    status: historyStatus,
    detail: historyDetail
  });

  // Factor 4: Credit Mix / Active Accounts (10% Weight)
  let mixScore = 0;
  let mixStatus = 'Moderate';
  let mixDetail = '';
  if (activeLoansCount >= 2 && activeLoansCount <= 5) {
    mixScore = 100;
    mixStatus = 'Good';
    mixDetail = `Balanced portfolio with ${activeLoansCount} active credit lines.`;
  } else if (activeLoansCount === 1) {
    mixScore = 70;
    mixStatus = 'Moderate';
    mixDetail = 'Single active credit line. Maintaining diversified credit will help long term.';
  } else {
    mixScore = 60;
    mixStatus = 'Moderate';
    mixDetail = `${activeLoansCount} active accounts. Ensure concurrent debts do not stretch cash flow.`;
  }
  factors.push({
    name: 'Credit Mix',
    weight: 10,
    score: mixScore,
    status: mixStatus,
    detail: mixDetail
  });

  // Factor 5: Recent Inquiries (10% Weight)
  let inquiryScore = 0;
  let inquiryStatus = 'Good';
  let inquiryDetail = '';
  if (recentInquiriesCount === 0) {
    inquiryScore = 100;
    inquiryStatus = 'Good';
    inquiryDetail = 'No hard inquiries in recent months.';
  } else if (recentInquiriesCount <= 2) {
    inquiryScore = 75;
    inquiryStatus = 'Moderate';
    inquiryDetail = `${recentInquiriesCount} recent inquiry/inquiries; standard activity.`;
  } else {
    inquiryScore = 40;
    inquiryStatus = 'Needs Work';
    inquiryDetail = `Elevated inquiries (${recentInquiriesCount} in 6 months) may signal credit-seeking urgency.`;
    recommendations.push('Refrain from submitting multiple loan applications simultaneously to avoid compounding inquiry penalties.');
  }
  factors.push({
    name: 'Recent Inquiries',
    weight: 10,
    score: inquiryScore,
    status: inquiryStatus,
    detail: inquiryDetail
  });

  // Calculate Weighted Health Index (0-100)
  const healthIndex = Math.round(
    factors.reduce((acc, f) => acc + (f.score * (f.weight / 100)), 0)
  );

  if (recommendations.length === 0) {
    recommendations.push('Maintain your current disciplined repayment schedule and keep credit card balances low.');
  }

  return {
    creditScore: score,
    scoreTier: tierInfo.label,
    riskLevel: tierInfo.riskLevel,
    healthIndex,
    factorBreakdown: factors,
    recommendations,
    disclaimer: 'Educational demonstration model only. Does not reflect proprietary scores from CIBIL, Experian, or any certified credit rating agency.'
  };
}

module.exports = {
  analyzeCreditProfile
};
