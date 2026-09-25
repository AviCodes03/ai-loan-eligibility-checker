/**
 * Module 1: Loan Eligibility Checker UI Logic
 * Synchronizes inputs, submits payload, caches assessment, and renders
 * high-fidelity visual results with radial score gauge and metric cards.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loan-check-form');
  const amountSlider = document.getElementById('loan-amount-slider');
  const amountInput = document.getElementById('loan-amount-input');
  const tenureSlider = document.getElementById('loan-tenure-slider');
  const tenureInput = document.getElementById('loan-tenure-input');
  const rateSlider = document.getElementById('loan-rate-slider');
  const rateInput = document.getElementById('loan-rate-input');
  const resultContainer = document.getElementById('loan-result-container');

  // Synchronize Sliders with Numeric Inputs
  function syncInputs(slider, input, displayId, prefix = '', suffix = '') {
    if (!slider || !input) return;
    const display = document.getElementById(displayId);

    const update = (val) => {
      slider.value = val;
      input.value = val;
      if (display) {
        display.textContent = `${prefix}${Number(val).toLocaleString('en-IN')}${suffix}`;
      }
    };

    slider.addEventListener('input', (e) => update(e.target.value));
    input.addEventListener('input', (e) => update(e.target.value));
    // Initial display
    update(input.value);
  }

  syncInputs(amountSlider, amountInput, 'display-loan-amount', '₹');
  syncInputs(tenureSlider, tenureInput, 'display-loan-tenure', '', ' mos');
  syncInputs(rateSlider, rateInput, 'display-loan-rate', '', '%');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const monthlyIncome = parseFloat(document.getElementById('monthly-income').value);
      const existingEmi = parseFloat(document.getElementById('existing-emi').value) || 0;
      const requestedLoanAmount = parseFloat(amountInput.value);
      const tenureMonths = parseInt(tenureInput.value, 10);
      const interestRate = parseFloat(rateInput.value);
      const creditScore = parseInt(document.getElementById('loan-credit-score').value, 10);
      const employmentType = document.getElementById('employment-type').value;
      const ageInput = document.getElementById('applicant-age');
      const age = ageInput ? parseInt(ageInput.value, 10) : 28;

      // Client-Side Pre-validation
      if (isNaN(monthlyIncome) || monthlyIncome <= 0) {
        window.appToast('Please enter a valid monthly income greater than 0', 'error');
        return;
      }
      if (isNaN(creditScore) || creditScore < 300 || creditScore > 900) {
        window.appToast('Credit score must be between 300 and 900', 'error');
        return;
      }
      if (ageInput && (isNaN(age) || age < 18 || age > 100)) {
        window.appToast('Applicant age must be between 18 and 100 years', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Evaluating Eligibility...';

      try {
        const response = await window.apiClient.post('loan/check', {
          monthlyIncome,
          existingEmi,
          requestedLoanAmount,
          tenureMonths,
          interestRate,
          creditScore,
          employmentType,
          age
        });

        if (response.success) {
          renderLoanResult(response.data);
          window.appToast('Assessment computed successfully!', 'success');
          // Cache latest assessment for AI Coaching and Sheets submission
          window.latestAssessment = {
            ...response.data,
            input: { monthlyIncome, existingEmi, requestedLoanAmount, tenureMonths, interestRate, creditScore, employmentType, age }
          };
        }
      } catch (err) {
        window.appToast(err.message || 'Failed to evaluate loan eligibility.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  function renderLoanResult(data) {
    if (!resultContainer) return;
    resultContainer.style.display = 'block';

    const statusClass = data.isEligible
      ? (data.status === 'Conditionally Eligible' ? 'status-conditional' : 'status-eligible')
      : 'status-ineligible';

    const statusBadgeColor = data.isEligible
      ? (data.status === 'Conditionally Eligible' ? 'var(--color-warning)' : 'var(--color-success)')
      : 'var(--color-danger)';

    const statusBadgeBg = data.isEligible
      ? (data.status === 'Conditionally Eligible' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)')
      : 'var(--color-danger-bg)';

    const statusBadgeBorder = data.isEligible
      ? (data.status === 'Conditionally Eligible' ? 'var(--color-warning-border)' : 'var(--color-success-border)')
      : 'var(--color-danger-border)';

    const score = Number(data.eligibilityScore) || 0;
    // Radial gauge circumference: 2 * pi * 36 ~= 226.2
    const circumference = 226.2;
    const strokeDashoffset = circumference - (circumference * (score / 100));

    resultContainer.innerHTML = `
      <div class="result-box ${statusClass}">
        
        <!-- Top Status Banner -->
        <div class="result-top-banner">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 2px;">Assessment Verdict</h3>
            <span style="font-size: 0.8rem; color: var(--color-text-muted);">Deterministic Underwriting Rules Applied</span>
          </div>
          <span class="result-status-pill" style="background: ${statusBadgeBg}; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeBorder};">
            ${data.status === 'Eligible' ? '✓' : (data.status === 'Conditionally Eligible' ? '⚡' : '✕')} ${data.status}
          </span>
        </div>

        <!-- Radial Score Hero Card -->
        <div class="result-radial-container">
          <div class="radial-ring-wrapper">
            <svg viewBox="0 0 84 84">
              <circle class="radial-ring-bg" cx="42" cy="42" r="36" />
              <circle class="radial-ring-fill" cx="42" cy="42" r="36" 
                      style="stroke: ${statusBadgeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset};" />
            </svg>
            <div class="radial-ring-text">
              <span>${score}</span>
              <span class="max-score">/ 100</span>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 0.76rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Eligibility Score Rating</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin: 2px 0;">
              ${score >= 75 ? 'Prime Borrowing Standing' : (score >= 55 ? 'Moderate Affordability Standing' : 'Constrained Borrowing Profile')}
            </div>
            <div style="font-size: 0.82rem; color: var(--color-text-muted);">
              Risk Classification: <strong style="color: ${statusBadgeColor};">${data.riskTier}</strong>
            </div>
          </div>
        </div>

        <!-- Key Financial Telemetry Grid -->
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Calculated FOIR</div>
            <div class="stat-value" style="color: ${data.foir <= (data.maxPermissibleFoirPct || 50) ? 'var(--color-success)' : 'var(--color-danger)'};">
              ${data.foir}%
            </div>
            <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 2px;">Limit: ${data.maxPermissibleFoirPct || 50}%</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Debt-to-Income</div>
            <div class="stat-value">${data.dti}%</div>
            <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 2px;">Total leverage</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Estimated EMI</div>
            <div class="stat-value" style="color: var(--color-primary);">${window.APP_CONFIG.formatINR(data.calculatedEmi)}</div>
            <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 2px;">Monthly commitment</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Max Borrowing Limit</div>
            <div class="stat-value" style="color: var(--color-primary);">${window.APP_CONFIG.formatINR(data.maxEligibleAmount)}</div>
            <div style="font-size: 0.68rem; color: var(--color-text-muted); margin-top: 2px;">Affordability cap</div>
          </div>
        </div>

        <!-- Detailed Evaluation Notes -->
        <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--color-border);">
          <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 10px;">
            Deterministic Assessment Notes:
          </h4>
          <ul class="reasons-list">
            ${data.reasons.map((r) => `
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="${statusBadgeColor}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${r}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Next Action CTAs -->
        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary" onclick="window.switchToTab('tab-ai-tips')" style="font-size: 0.88rem;">
            <span>✨ Get AI Coaching Tips</span>
          </button>
          <button type="button" class="btn btn-secondary" onclick="window.switchToTab('tab-sheets')" style="font-size: 0.88rem;">
            <span>📊 Save to Google Sheets</span>
          </button>
        </div>
      </div>
    `;

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
