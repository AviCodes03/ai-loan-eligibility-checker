/**
 * Claude AI Financial Coaching Service
 * Uses @anthropic-ai/sdk to provide contextual, constructive financial literacy guidance.
 * Strictly bound by system instructions: Claude CANNOT calculate, alter, or override
 * deterministic eligibility scores, FOIR, DTI, or loan decisions.
 * Gracefully activates deterministic offline guidance if Claude is unavailable.
 */

const CLAUDE_SYSTEM_PROMPT = `You are an educational financial literacy mentor in an academic demonstration application called "AI Loan Eligibility Checker".

CRITICAL BOUNDARIES & INSTRUCTIONS:
1. You are an EDUCATIONAL MENTOR ONLY. You DO NOT have the authority to approve loans, grant credit, determine interest rates, or provide legally binding financial advice.
2. The applicant's financial eligibility has ALREADY been calculated deterministically by standard banking formulas (FOIR, DTI, and reducing-balance EMI). You must NEVER recalculate, override, contradict, or alter these numbers.
3. Your sole role is to provide constructive, accessible, and responsible financial coaching explaining the applicant's debt profile, highlighting positive factors, explaining vulnerabilities, and offering actionable educational steps.
4. You must respond in VALID, PURE JSON with NO markdown code fences, NO introductory commentary, and NO trailing text.

JSON RESPONSE SCHEMA:
{
  "summary": "2-3 sentence overview explaining what the debt and income metrics indicate.",
  "strengths": ["string", "string"],
  "risks": ["string", "string"],
  "recommendations": [
    { "title": "string", "detail": "string" },
    { "title": "string", "detail": "string" },
    { "title": "string", "detail": "string" }
  ],
  "disclaimer": "Educational demonstration analysis provided by Claude AI. Not certified banking or credit counseling."
}`;

/**
 * Builds user prompt injecting the applicant's deterministic assessment results
 */
function buildUserPrompt(profile = {}) {
  const income = Number(profile.monthlyIncome) || 0;
  const existingEmi = Number(profile.existingEmi) || 0;
  const requested = Number(profile.requestedLoanAmount) || 0;
  const maxApproved = Number(profile.maxEligibleAmount) || 0;
  const emi = Number(profile.calculatedEmi) || 0;
  const foir = profile.foir !== undefined ? profile.foir : 'N/A';
  const dti = profile.dti !== undefined ? profile.dti : 'N/A';
  const score = profile.creditScore || 'N/A';
  const tier = profile.creditTier || profile.riskTier || 'Standard';
  const status = profile.status || 'N/A';

  return `Here are the deterministic assessment results calculated for the applicant:
- Net Monthly Income: ₹${income.toLocaleString('en-IN')}
- Existing Debt EMIs: ₹${existingEmi.toLocaleString('en-IN')}
- Requested Loan Principal: ₹${requested.toLocaleString('en-IN')}
- Maximum Permissible Borrowing Capacity: ₹${maxApproved.toLocaleString('en-IN')}
- Estimated Monthly EMI: ₹${emi.toLocaleString('en-IN')}
- Fixed Obligation to Income Ratio (FOIR): ${foir}%
- Debt-to-Income Ratio (DTI): ${dti}%
- Credit Score: ${score} (${tier})
- Deterministic Assessment Status: ${status}

Please generate constructive educational financial coaching following the required JSON schema.`;
}

/**
 * Deterministic Rule-Based Financial Guidance Engine (Offline Demo Fallback)
 * Activated when Claude API key is missing, network is offline, or API error occurs.
 *
 * @param {object} profile - Financial profile summary
 * @returns {object} Structured guidance matching Claude's expected output schema
 */
function generateRuleBasedTips(profile = {}) {
  const income = Number(profile.monthlyIncome) || 50000;
  const requested = Number(profile.requestedLoanAmount) || 500000;
  const score = Number(profile.creditScore) || 720;
  const foir = Number(profile.foir) || 30;
  const status = profile.status || 'Eligible';

  const strengths = [];
  const risks = [];
  const recommendations = [];

  // 1. Evaluate Strengths
  if (score >= 750) {
    strengths.push('Excellent credit score provides leverage for negotiating lower interest rates.');
  } else if (score >= 700) {
    strengths.push('Good credit score meets benchmark thresholds for standard retail lending.');
  }

  if (foir <= 35) {
    strengths.push(`Healthy FOIR of ${foir}% leaves substantial cash-flow buffer for savings and emergencies.`);
  } else if (foir <= 50) {
    strengths.push('Debt obligations are currently within standard sustainable demo limits.');
  }

  if (income >= 75000) {
    strengths.push('Strong regular income provides resilience against unexpected financial shocks.');
  }

  if (strengths.length === 0) {
    strengths.push('Consistent income source provides a baseline foundation for credit improvement.');
  }

  // 2. Evaluate Risks & Vulnerabilities
  if (foir > 50) {
    risks.push(`Elevated FOIR (${foir}%) indicates that over half your monthly income is committed to debt repayments.`);
  }

  if (score < 650) {
    risks.push(`Credit score (${score}) places you in a higher risk tier, likely requiring a co-applicant or security deposit.`);
  }

  if (requested > (income * 20)) {
    risks.push('Requested loan amount represents a significant multiple of annual income, requiring disciplined budgeting.');
  }

  if (risks.length === 0) {
    risks.push('Low overall debt risk profile; primary focus should be avoiding unnecessary borrowing.');
  }

  // 3. Actionable Educational Roadmap
  if (foir > 40) {
    recommendations.push({
      title: 'Targeted Debt Acceleration',
      detail: 'Apply the avalanche method (paying highest-interest debts first) to bring your FOIR below 40% before taking on new obligations.'
    });
  } else {
    recommendations.push({
      title: 'Tenure & EMI Optimization',
      detail: 'Opt for the shortest comfortable loan tenure to minimize the total lifetime interest paid to the lender.'
    });
  }

  if (score < 750) {
    recommendations.push({
      title: 'Credit Utilization Management',
      detail: 'Keep revolving credit card balances below 30% of your total limit and ensure no missed utility or loan payments.'
    });
  } else {
    recommendations.push({
      title: 'Emergency Reserve Buffer',
      detail: 'Maintain at least 3 to 6 months of total EMI obligations in a high-liquidity emergency fund before loan disbursement.'
    });
  }

  recommendations.push({
    title: 'Amortization Prepayment Strategy',
    detail: 'Making just one extra EMI payment per year can shave significant interest and several months off your loan schedule.'
  });

  const summary = status === 'Eligible'
    ? 'Your financial assessment demonstrates a viable credit profile with manageable debt obligations relative to income.'
    : 'Your financial assessment suggests conditional risk factors; optimizing existing debt and strengthening credit will improve borrowing terms.';

  return {
    source: 'fallback',
    badge: 'Demo Rule-Based Guidance (Offline Fallback)',
    model: 'rule-based-v1.0',
    summary,
    strengths,
    risks,
    recommendations,
    disclaimer: 'Educational demonstration guidance only. Not intended as certified financial or legal counsel.'
  };
}

/**
 * Calls Anthropic Claude API with strict guardrails and timeout
 *
 * @param {object} profileSummary
 * @param {object} [customClient=null] - Optional client instance for unit testing
 * @returns {Promise<object|null>} Claude response or null
 */
async function callClaudeApi(profileSummary, customClient = null) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }

  let client = customClient;
  if (!client) {
    const Anthropic = require('@anthropic-ai/sdk');
    client = new Anthropic({
      apiKey: apiKey.trim(),
      timeout: 10000 // 10 second timeout
    });
  }

  const prompt = buildUserPrompt(profileSummary);

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0.3,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  const rawText = response?.content?.[0]?.text || '';
  let cleaned = rawText.trim();

  // Strip Markdown code block tags if returned
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  const parsed = JSON.parse(cleaned);

  return {
    source: 'claude',
    badge: 'Generated by Anthropic Claude (claude-3-5-sonnet)',
    model: response.model || 'claude-3-5-sonnet-20241022',
    summary: parsed.summary || 'Educational financial assessment generated by Claude.',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    disclaimer: parsed.disclaimer || 'Educational demonstration analysis provided by Claude AI. Not certified banking or credit counseling.'
  };
}

/**
 * Top-level Orchestrator: Calls Claude API with automatic, seamless fallback
 *
 * @param {object} profileSummary - The deterministic calculation results
 * @param {object} [customClient=null] - Optional Anthropic SDK client for unit tests
 * @returns {Promise<object>} Either Claude-generated or fallback guidance
 */
async function generateFinancialTips(profileSummary, customClient = null) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 1. Missing API Key -> Immediate Fallback
  if (!apiKey || apiKey.trim().length === 0) {
    return generateRuleBasedTips(profileSummary);
  }

  // 2. Attempt Claude API Call
  try {
    const claudeResult = await callClaudeApi(profileSummary, customClient);
    if (claudeResult) {
      return claudeResult;
    }
  } catch (err) {
    // Sanitize error message to ensure no API key or sensitive data is logged
    const safeErrorMsg = err?.message
      ? err.message.replace(/sk-ant-[a-zA-Z0-9_-]+/g, '[REDACTED_API_KEY]')
      : 'Claude API call failed';

    console.warn(`[Claude API Notice] ${safeErrorMsg}. Activating deterministic offline fallback.`);
  }

  // 3. Fallback on any failure/timeout
  return generateRuleBasedTips(profileSummary);
}

module.exports = {
  generateFinancialTips,
  generateRuleBasedTips,
  callClaudeApi,
  buildUserPrompt,
  CLAUDE_SYSTEM_PROMPT
};
