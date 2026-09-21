/**
 * Financial & Application Constants
 * Example/demo thresholds used by this educational application.
 * Note: In practical finance, FOIR, DTI, and eligibility criteria are configurable
 * and vary across different lenders, credit policies, and loan products.
 */

module.exports = {
  // Configurable demo Fixed Obligation to Income Ratio (FOIR) limits based on monthly income tiers (in INR ₹)
  FOIR_LIMITS: {
    LOW_INCOME_MAX: 30000,      // Up to ₹30,000 monthly income (demo benchmark)
    LOW_INCOME_FOIR: 0.40,      // Example demo threshold: Max 40% FOIR
    MID_INCOME_MAX: 75000,      // ₹30,001 to ₹75,000 monthly income
    MID_INCOME_FOIR: 0.50,      // Example demo threshold: Max 50% FOIR
    HIGH_INCOME_FOIR: 0.60      // Above ₹75,000 monthly income -> Example demo threshold: Max 60% FOIR
  },

  // Example Debt-to-Income (DTI) Thresholds for educational demonstration
  DTI_THRESHOLDS: {
    HEALTHY: 36,   // Demo threshold: below 36%
    MODERATE: 45,  // Demo threshold: 36% - 45%
    HIGH_RISK: 50  // Demo threshold: above 50%
  },

  // Example Credit Score Tiers (Standard 300 - 900 scale)
  CREDIT_SCORE_TIERS: {
    EXCELLENT: { min: 750, max: 900, label: 'Excellent', riskLevel: 'Low', ltvCapPct: 100 },
    GOOD: { min: 700, max: 749, label: 'Good', riskLevel: 'Low-Moderate', ltvCapPct: 90 },
    FAIR: { min: 650, max: 699, label: 'Fair / Moderate', riskLevel: 'Moderate', ltvCapPct: 80 },
    POOR: { min: 550, max: 649, label: 'Poor', riskLevel: 'High', ltvCapPct: 60 },
    CRITICAL: { min: 300, max: 549, label: 'Critical / High Risk', riskLevel: 'Very High', ltvCapPct: 0 }
  },

  // Input Validation Bounds (in INR ₹)
  VALIDATION_BOUNDS: {
    MIN_CREDIT_SCORE: 300,
    MAX_CREDIT_SCORE: 900,
    MIN_TENURE_MONTHS: 1,
    MAX_TENURE_MONTHS: 360,
    MIN_LOAN_AMOUNT: 10000,       // Min ₹10,000
    MAX_LOAN_AMOUNT: 100000000,   // Max ₹10 Crore (₹100,000,000)
    MIN_INTEREST_RATE: 0.1,
    MAX_INTEREST_RATE: 50.0
  }
};
