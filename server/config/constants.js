/**
 * Financial & Application Constants
 * Standard industry heuristic thresholds for educational demonstration.
 */

module.exports = {
  // Fixed Obligation to Income Ratio (FOIR) limits based on monthly income tiers
  FOIR_LIMITS: {
    LOW_INCOME_MAX: 3000,       // Up to 3,000 monthly income
    LOW_INCOME_FOIR: 0.40,      // Max 40% FOIR
    MID_INCOME_MAX: 7500,       // 3,001 to 7,500 monthly income
    MID_INCOME_FOIR: 0.50,      // Max 50% FOIR
    HIGH_INCOME_FOIR: 0.60      // Above 7,500 monthly income -> Max 60% FOIR
  },

  // Debt-to-Income (DTI) Thresholds
  DTI_THRESHOLDS: {
    HEALTHY: 36,   // Below 36% is standard healthy DTI
    MODERATE: 45,  // 36% - 45% requires review
    HIGH_RISK: 50  // Above 50% represents over-leverage
  },

  // Credit Score Tiers (Standard 300 - 900 scale)
  CREDIT_SCORE_TIERS: {
    EXCELLENT: { min: 750, max: 900, label: 'Excellent', riskLevel: 'Low', ltvCapPct: 100 },
    GOOD: { min: 700, max: 749, label: 'Good', riskLevel: 'Low-Moderate', ltvCapPct: 90 },
    FAIR: { min: 650, max: 699, label: 'Fair / Moderate', riskLevel: 'Moderate', ltvCapPct: 80 },
    POOR: { min: 550, max: 649, label: 'Poor', riskLevel: 'High', ltvCapPct: 60 },
    CRITICAL: { min: 300, max: 549, label: 'Critical / High Risk', riskLevel: 'Very High', ltvCapPct: 0 }
  },

  // Input Validation Bounds
  VALIDATION_BOUNDS: {
    MIN_CREDIT_SCORE: 300,
    MAX_CREDIT_SCORE: 900,
    MIN_TENURE_MONTHS: 1,
    MAX_TENURE_MONTHS: 360,
    MIN_LOAN_AMOUNT: 100,
    MAX_LOAN_AMOUNT: 10000000,
    MIN_INTEREST_RATE: 0.1,
    MAX_INTEREST_RATE: 50.0
  }
};
