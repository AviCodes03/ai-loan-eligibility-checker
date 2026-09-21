/**
 * EMI Calculation Service
 * Deterministic standard reducing-balance EMI and amortization schedule generator.
 * Note: Uses standard banking mathematical formula:
 * E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */

/**
 * Calculates monthly EMI, total interest, and total repayment.
 * Handles edge cases like zero interest rate safely.
 *
 * @param {number} principal - Principal loan amount in INR
 * @param {number} annualInterestRate - Annual interest rate percentage (e.g. 8.5)
 * @param {number} tenureMonths - Loan tenure in months (integer)
 * @returns {object} EMI calculation summary and amortization details
 */
function calculateEmi(principal, annualInterestRate, tenureMonths) {
  const p = Number(principal);
  const annualRate = Number(annualInterestRate);
  const n = Math.round(Number(tenureMonths));

  if (!Number.isFinite(p) || p <= 0) {
    throw new Error('Principal amount must be a positive number greater than 0.');
  }
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('Tenure months must be a positive integer greater than 0.');
  }
  if (!Number.isFinite(annualRate) || annualRate < 0) {
    throw new Error('Annual interest rate must be 0 or a positive number.');
  }

  // Monthly interest rate
  const r = annualRate > 0 ? (annualRate / 100) / 12 : 0;
  let monthlyEmi = 0;

  // Safe zero-interest handling
  if (r === 0) {
    monthlyEmi = p / n;
  } else {
    const compoundFactor = Math.pow(1 + r, n);
    monthlyEmi = (p * r * compoundFactor) / (compoundFactor - 1);
  }

  const totalPayment = monthlyEmi * n;
  const totalInterest = Math.max(0, totalPayment - p);
  const principalSharePct = totalPayment > 0 ? Number(((p / totalPayment) * 100).toFixed(2)) : 100;
  const interestSharePct = totalPayment > 0 ? Number(((totalInterest / totalPayment) * 100).toFixed(2)) : 0;

  return {
    principal: Math.round(p * 100) / 100,
    annualInterestRate: annualRate,
    tenureMonths: n,
    monthlyEmi: Math.round(monthlyEmi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    principalSharePct,
    interestSharePct
  };
}

/**
 * Generates month-by-month amortization breakdown
 *
 * @param {number} principal
 * @param {number} annualInterestRate
 * @param {number} tenureMonths
 * @returns {Array<object>} Amortization schedule entries
 */
function generateAmortizationSchedule(principal, annualInterestRate, tenureMonths) {
  const summary = calculateEmi(principal, annualInterestRate, tenureMonths);
  const r = annualInterestRate > 0 ? (annualInterestRate / 100) / 12 : 0;
  const schedule = [];

  let balance = summary.principal;
  const emi = summary.monthlyEmi;

  for (let m = 1; m <= summary.tenureMonths; m++) {
    const interestPortion = r === 0 ? 0 : balance * r;
    const principalPortion = m === summary.tenureMonths ? balance : emi - interestPortion;
    const closingBalance = Math.max(0, balance - principalPortion);

    schedule.push({
      period: m,
      openingBalance: Math.round(balance * 100) / 100,
      monthlyEmi: Math.round(emi * 100) / 100,
      principalPaid: Math.round(principalPortion * 100) / 100,
      interestPaid: Math.round(interestPortion * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100
    });

    balance = closingBalance;
  }

  return {
    ...summary,
    schedule
  };
}

module.exports = {
  calculateEmi,
  generateAmortizationSchedule
};
