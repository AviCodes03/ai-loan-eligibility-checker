/**
 * Module 1: Loan Eligibility Checker UI Logic
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
        display.textContent = `${prefix}${Number(val).toLocaleString()}${suffix}`;
      }
    };

    slider.addEventListener('input', (e) => update(e.target.value));
    input.addEventListener('input', (e) => update(e.target.value));
    // Initial display
    update(input.value);
  }

  syncInputs(amountSlider, amountInput, 'display-loan-amount', '$');
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

      // Client-Side Pre-validation
      if (isNaN(monthlyIncome) || monthlyIncome <= 0) {
        window.appToast('Please enter a valid monthly income greater than 0', 'error');
        return;
      }
      if (isNaN(creditScore) || creditScore < 300 || creditScore > 900) {
        window.appToast('Credit score must be between 300 and 900', 'error');
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
          employmentType
        });

        if (response.success) {
          renderLoanResult(response.data);
          window.appToast('Assessment computed successfully!', 'success');
          // Cache latest assessment for AI Coaching and Sheets submission
          window.latestAssessment = {
            ...response.data,
            input: { monthlyIncome, existingEmi, requestedLoanAmount, tenureMonths, interestRate, creditScore, employmentType }
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

    resultContainer.innerHTML = `
      <div class="result-box ${statusClass}">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <h3 style="font-size: 1.2rem; font-weight: 800;">Assessment Verdict</h3>
          <span style="background: ${statusBadgeColor}; color: #fff; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;">
            ${data.status}
          </span>
        </div>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Max Eligible Amount</div>
            <div class="stat-value" style="color: var(--color-primary);">$${Math.round(data.maxEligibleAmount).toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Estimated Monthly EMI</div>
            <div class="stat-value">$${Math.round(data.calculatedEmi).toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Calculated FOIR</div>
            <div class="stat-value">${data.foir}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Risk Profile</div>
            <div class="stat-value" style="font-size: 1rem;">${data.riskTier}</div>
          </div>
        </div>

        <div style="margin-top: 14px;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 6px;">Evaluation Notes:</h4>
          <ul style="padding-left: 20px; font-size: 0.88rem; color: var(--color-text-main);">
            ${data.reasons.map((r) => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-top: 18px; display: flex; gap: 10px; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary" onclick="window.switchToTab('tab-ai-tips')">
            ✨ Get AI Coaching Tips
          </button>
          <button type="button" class="btn btn-secondary" onclick="window.switchToTab('tab-sheets')">
            📊 Save to Google Sheets
          </button>
        </div>
      </div>
    `;

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
