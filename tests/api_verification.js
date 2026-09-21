/**
 * Live End-to-End API and Integration Verification Script
 */

async function testAll() {
  const base = 'http://localhost:3000/api';
  const post = async (endpoint, data) => {
    const res = await fetch(`${base}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return { status: res.status, ok: res.ok, data: json };
  };

  console.log('=== 1. Loan Eligibility API Tests ===');
  const loanValid = await post('loan/check', {
    monthlyIncome: 50000,
    existingEmi: 10000,
    requestedLoanAmount: 1000000,
    tenureMonths: 60,
    interestRate: 8.5,
    creditScore: 740,
    employmentType: 'Salaried'
  });
  console.log('Loan Valid Status:', loanValid.status);
  console.log('Loan Valid Data:', loanValid.data.data ? {
    status: loanValid.data.data.status,
    eligibilityScore: loanValid.data.data.eligibilityScore,
    maxEligibleAmount: loanValid.data.data.maxEligibleAmount,
    calculatedEmi: loanValid.data.data.calculatedEmi,
    foir: loanValid.data.data.foir,
    reasonsCount: loanValid.data.data.reasons.length
  } : loanValid.data);

  const loanOverleveraged = await post('loan/check', {
    monthlyIncome: 50000,
    existingEmi: 30000,
    requestedLoanAmount: 500000,
    tenureMonths: 60,
    interestRate: 8.5,
    creditScore: 740
  });
  console.log('Loan Overleveraged Status:', loanOverleveraged.status);
  console.log('Loan Overleveraged Verdict:', loanOverleveraged.data.data ? {
    status: loanOverleveraged.data.data.status,
    riskTier: loanOverleveraged.data.data.riskTier
  } : loanOverleveraged.data);

  const loanInvalidScore = await post('loan/check', {
    monthlyIncome: 50000,
    existingEmi: 10000,
    requestedLoanAmount: 1000000,
    tenureMonths: 60,
    interestRate: 8.5,
    creditScore: 200
  });
  console.log('Loan Invalid Score (200) Status:', loanInvalidScore.status);
  console.log('Loan Invalid Score Error:', loanInvalidScore.data.error, loanInvalidScore.data.details);

  console.log('\n=== 2. EMI Calculation API Tests ===');
  const emiValid = await post('emi/calculate', {
    principal: 500000,
    annualInterestRate: 9.0,
    tenureMonths: 36
  });
  console.log('EMI Valid Status:', emiValid.status);
  console.log('EMI Valid Data:', emiValid.data.data ? {
    monthlyEmi: emiValid.data.data.monthlyEmi,
    totalInterest: emiValid.data.data.totalInterest,
    totalPayment: emiValid.data.data.totalPayment,
    scheduleCount: emiValid.data.data.schedule.length
  } : emiValid.data);

  const emiZeroRate = await post('emi/calculate', {
    principal: 60000,
    annualInterestRate: 0,
    tenureMonths: 12
  });
  console.log('EMI Zero Rate Status:', emiZeroRate.status);
  console.log('EMI Zero Rate Data:', emiZeroRate.data.data ? {
    monthlyEmi: emiZeroRate.data.data.monthlyEmi,
    totalInterest: emiZeroRate.data.data.totalInterest
  } : emiZeroRate.data);

  const emiInvalid = await post('emi/calculate', {
    principal: -50000,
    annualInterestRate: 9.0,
    tenureMonths: 36
  });
  console.log('EMI Negative Principal Status:', emiInvalid.status);
  console.log('EMI Negative Principal Error:', emiInvalid.data.error);

  console.log('\n=== 3. Credit Analysis API Tests ===');
  const creditValid = await post('credit/analyze', {
    creditScore: 740,
    onTimePaymentPct: 98,
    creditUtilizationPct: 28
  });
  console.log('Credit Valid Status:', creditValid.status);
  console.log('Credit Valid Data:', creditValid.data.data ? {
    scoreTier: creditValid.data.data.scoreTier,
    healthIndex: creditValid.data.data.healthIndex,
    factorsCount: creditValid.data.data.factorBreakdown.length,
    disclaimer: creditValid.data.data.disclaimer
  } : creditValid.data);

  const creditOutOfRange = await post('credit/analyze', {
    creditScore: 980
  });
  console.log('Credit Out of Range (980) Status:', creditOutOfRange.status);
  console.log('Credit Out of Range Error:', creditOutOfRange.data.error);
}

testAll().catch(console.error);
