/**
 * Loan Eligibility Calculation Service
 * Deterministic rule-based evaluation engine for educational demonstration.
 * Note: Claude AI is NEVER used to calculate scores or decisions.
 */

const { FOIR_LIMITS, CREDIT_SCORE_TIERS } = require('../config/constants');
const { calculateEmi } = require('./emiService');

/**
 * Evaluates loan eligibility deterministically
 *
 * @param {object} params
 * @param {number} params.monthlyIncome - Net monthly income in INR
 * @param {number} params.existingEmi - Existing monthly debt EMIs in INR
 * @param {number} params.requestedLoanAmount - Requested loan amount in INR
 * @param {number} params.tenureMonths - Tenure in months
 * @param {number} params.interestRate - Annual interest rate percentage
 * @param {number} params.creditScore - Credit score (300-900)
 * @param {string} [params.employmentType] - Employment type
 * @param {number} [params.age] - Applicant age in years (default 28)
 * @returns {object} Deterministic assessment results
 */
function evaluateLoanEligibility({
  monthlyIncome,
  existingEmi = 0,
  requestedLoanAmount,
  tenureMonths,
  interestRate,
  creditScore,
  employmentType = 'Salaried',
  age = 28
}) {
  const reasons = [];

  // Age benchmark check (Demo standard: 21 to 65 years at loan maturity)
  const maturityAge = age + (tenureMonths / 12);
  const isUnderage = age < 21;
  const isPostRetirement = maturityAge > 65;

  // 1. Calculate Proposed Loan's Monthly EMI
  const emiSummary = calculateEmi(requestedLoanAmount, interestRate, tenureMonths);
  const proposedEmi = emiSummary.monthlyEmi;

  // 2. Determine Max Allowable FOIR (Demo benchmark based on income bracket)
  let maxFoirPct = FOIR_LIMITS.MID_INCOME_FOIR;
  if (monthlyIncome <= FOIR_LIMITS.LOW_INCOME_MAX) {
    maxFoirPct = FOIR_LIMITS.LOW_INCOME_FOIR;
  } else if (monthlyIncome > FOIR_LIMITS.MID_INCOME_MAX) {
    maxFoirPct = FOIR_LIMITS.HIGH_INCOME_FOIR;
  }

  // 3. Compute Current and Total FOIR & DTI
  const currentDebtRatioPct = Number(((existingEmi / monthlyIncome) * 100).toFixed(1));
  const totalObligations = existingEmi + proposedEmi;
  const calculatedFoirPct = Number(((totalObligations / monthlyIncome) * 100).toFixed(1));
  const dtiPct = Number(((existingEmi / monthlyIncome) * 100).toFixed(1));

  // 4. Compute Maximum Affordable Monthly EMI
  const maxAllowableEmiTotal = monthlyIncome * maxFoirPct;
  const maxAffordableEmi = Math.max(0, maxAllowableEmiTotal - existingEmi);

  // 5. Compute Maximum Eligible Loan Capacity using Present Value Formula
  let maxEligibleLoanCapacity = 0;
  const monthlyRate = interestRate > 0 ? (interestRate / 100) / 12 : 0;

  if (maxAffordableEmi > 0) {
    if (monthlyRate === 0) {
      maxEligibleLoanCapacity = maxAffordableEmi * tenureMonths;
    } else {
      const pvFactor = (1 - Math.pow(1 + monthlyRate, -tenureMonths)) / monthlyRate;
      maxEligibleLoanCapacity = maxAffordableEmi * pvFactor;
    }
  }

  // 6. Credit Score Analysis & Gating
  let creditTier = CREDIT_SCORE_TIERS.CRITICAL;
  let creditFactor = 0;

  if (creditScore >= CREDIT_SCORE_TIERS.EXCELLENT.min) {
    creditTier = CREDIT_SCORE_TIERS.EXCELLENT;
    creditFactor = 1.0;
  } else if (creditScore >= CREDIT_SCORE_TIERS.GOOD.min) {
    creditTier = CREDIT_SCORE_TIERS.GOOD;
    creditFactor = 0.90;
  } else if (creditScore >= CREDIT_SCORE_TIERS.FAIR.min) {
    creditTier = CREDIT_SCORE_TIERS.FAIR;
    creditFactor = 0.75;
  } else if (creditScore >= CREDIT_SCORE_TIERS.POOR.min) {
    creditTier = CREDIT_SCORE_TIERS.POOR;
    creditFactor = 0.50;
  } else {
    creditTier = CREDIT_SCORE_TIERS.CRITICAL;
    creditFactor = 0.0;
  }

  // Apply credit factor to borrowing cap
  const adjustedMaxEligibleAmount = Math.round(maxEligibleLoanCapacity * creditFactor);

  // 7. Calculate Deterministic 0-100 Composite Eligibility Score
  // Component A: Debt Capacity / FOIR headroom (35 points)
  let foirScore = 0;
  if (currentDebtRatioPct <= 20) {
    foirScore = 35;
  } else if (currentDebtRatioPct <= 35) {
    foirScore = 25;
  } else if (currentDebtRatioPct <= (maxFoirPct * 100)) {
    foirScore = 15;
  } else {
    foirScore = 0;
  }

  // Component B: Credit Score Rating (40 points)
  const creditScorePoints = Math.round(((Math.max(300, Math.min(900, creditScore)) - 300) / 600) * 40);

  // Component C: Requested Amount vs Max Affordable Capacity (15 points)
  let capacityScore = 0;
  if (adjustedMaxEligibleAmount >= requestedLoanAmount) {
    capacityScore = 15;
  } else if (adjustedMaxEligibleAmount > 0) {
    capacityScore = Math.round((adjustedMaxEligibleAmount / requestedLoanAmount) * 15);
  }

  // Component D: Employment Stability Benchmark (10 points)
  let employmentScore = 7;
  if (employmentType === 'Salaried') employmentScore = 10;
  else if (employmentType === 'Self-Employed') employmentScore = 8;
  else if (employmentType === 'Student') employmentScore = 5;

  const eligibilityScore = Math.min(100, Math.max(0, foirScore + creditScorePoints + capacityScore + employmentScore));

  // 8. Determine Status and Generate Educational Reasons
  let isEligible = false;
  let status = 'Ineligible';
  let riskTier = 'High Risk';

  if (maxAffordableEmi <= 0) {
    status = 'Ineligible';
    isEligible = false;
    riskTier = 'High Risk (Over-leveraged)';
    reasons.push(`Existing debt obligations (₹${existingEmi.toLocaleString('en-IN')}) already consume or exceed the demo permissible limit of ${maxFoirPct * 100}% of your monthly income.`);
  } else if (creditScore < 550) {
    status = 'Ineligible';
    isEligible = false;
    riskTier = 'High Default Risk';
    reasons.push(`Credit score of ${creditScore} is in the Critical range (< 550) under this demo scoring model. Lenders typically require credit repair or debt restructuring.`);
  } else if (calculatedFoirPct > (maxFoirPct * 100) || requestedLoanAmount > (adjustedMaxEligibleAmount * 1.25)) {
    status = 'Conditionally Eligible';
    isEligible = true;
    riskTier = 'Moderate-High Risk';
    reasons.push(`The proposed monthly EMI (₹${Math.round(proposedEmi).toLocaleString('en-IN')}) pushes total debt obligations to ${calculatedFoirPct}% of income (demo threshold is ${maxFoirPct * 100}%).`);
    reasons.push(`You may be eligible for a reduced principal up to ₹${adjustedMaxEligibleAmount.toLocaleString('en-IN')}, or by extending loan tenure.`);
  } else if (creditScore < 650) {
    status = 'Conditionally Eligible';
    isEligible = true;
    riskTier = 'Moderate Risk';
    reasons.push(`Credit score (${creditScore}) is in the Fair/Poor tier under this demo model. Approval would typically require a creditworthy co-applicant or security deposit.`);
    if (adjustedMaxEligibleAmount >= requestedLoanAmount) {
      reasons.push(`Your income comfortably supports the requested borrowing capacity of ₹${requestedLoanAmount.toLocaleString('en-IN')}.`);
    }
  } else {
    status = 'Eligible';
    isEligible = true;
    riskTier = creditTier.riskLevel;
    reasons.push(`FOIR of ${calculatedFoirPct}% is within the demo guideline limit of ${maxFoirPct * 100}%.`);
    reasons.push(`Credit score of ${creditScore} qualifies for standard approval in this demo model.`);
    reasons.push(`Requested amount of ₹${requestedLoanAmount.toLocaleString('en-IN')} is within maximum estimated capacity of ₹${adjustedMaxEligibleAmount.toLocaleString('en-IN')}.`);
  }

  // Age gating evaluations
  if (isUnderage) {
    status = 'Ineligible';
    isEligible = false;
    riskTier = 'High Risk (Age Criteria)';
    reasons.unshift(`Applicant age (${age} years) is below the demo primary borrower threshold of 21 years (requires an adult co-applicant or guarantor).`);
  } else if (isPostRetirement && isEligible) {
    if (status === 'Eligible') {
      status = 'Conditionally Eligible';
      riskTier = 'Moderate Risk (Tenure Past Retirement)';
    }
    reasons.push(`Loan tenure extends to age ${Math.round(maturityAge)}, surpassing the demo retirement benchmark of 65 years. Lenders typically require tenure reduction or joint applicant.`);
  }

  // Educational note regarding demo criteria
  reasons.push('Note: These conclusions are calculated using transparent demo formulas and are not an official bank sanction.');

  return {
    isEligible,
    status,
    eligibilityScore,
    riskTier,
    applicantAge: age,
    monthlyIncome,
    existingEmi,
    requestedLoanAmount,
    maxEligibleAmount: adjustedMaxEligibleAmount,
    calculatedEmi: Math.round(proposedEmi),
    foir: calculatedFoirPct,
    dti: dtiPct,
    maxPermissibleFoirPct: Math.round(maxFoirPct * 100),
    reasons,
    creditTier: creditTier.label
  };
}

module.exports = {
  evaluateLoanEligibility
};
