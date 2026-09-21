/**
 * Module 5: Google Sheets Assessment Submission UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('sheets-submission-form');
  const summaryBox = document.getElementById('sheets-assessment-summary');
  const historyList = document.getElementById('assessment-history-list');

  // Load and refresh summary when tab is viewed
  function refreshSummary() {
    if (!summaryBox) return;
    const a = window.latestAssessment;
    if (!a) {
      summaryBox.innerHTML = `
        <div style="padding: 16px; background: #f8fafc; border: 1px dashed var(--color-border); border-radius: var(--radius-md); text-align: center; color: var(--color-text-muted); font-size: 0.88rem;">
          No assessment calculated yet. Please run the <a href="#" onclick="window.switchToTab('tab-loan-checker'); return false;">Loan Eligibility Checker</a> first.
        </div>
      `;
      return;
    }

    summaryBox.innerHTML = `
      <div style="background: var(--color-bg-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 8px;">
          <span>Current Assessment Summary</span>
          <span style="color: ${a.isEligible ? 'var(--color-success)' : 'var(--color-danger)'};">${a.status}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.84rem;">
          <div><strong>Monthly Income:</strong> ${window.APP_CONFIG.formatINR(a.input.monthlyIncome)}</div>
          <div><strong>Requested Loan:</strong> ${window.APP_CONFIG.formatINR(a.input.requestedLoanAmount)}</div>
          <div><strong>Credit Score:</strong> ${a.input.creditScore}</div>
          <div><strong>Estimated EMI:</strong> ${window.APP_CONFIG.formatINR(a.calculatedEmi)}/mo</div>
        </div>
      </div>
    `;
  }

  window.refreshSheetsSummary = refreshSummary;

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const assessment = window.latestAssessment;
      if (!assessment) {
        window.appToast('Please run the Loan Eligibility assessment before submitting.', 'info');
        window.switchToTab('tab-loan-checker');
        return;
      }

      const applicantName = document.getElementById('applicant-name').value.trim();
      const applicantEmail = document.getElementById('applicant-email').value.trim();

      if (!applicantName) {
        window.appToast('Please provide an applicant name or alias for this demo submission.', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving to Google Sheets...';

      try {
        const response = await window.apiClient.post('assessment/submit', {
          applicantName,
          applicantEmail,
          assessmentData: assessment
        });

        if (response.success) {
          window.appToast('Assessment successfully recorded to Google Sheets!', 'success');
          addHistoryRecord(applicantName, assessment);
          form.reset();
        } else {
          window.appToast(response.error || 'Notice: Google Sheets persistence is currently unconfigured.', 'info');
          // Still record in local session history
          addHistoryRecord(applicantName, assessment, 'Local Session Only');
        }
      } catch (err) {
        window.appToast(err.message || 'Failed to submit assessment to Google Sheets.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  function addHistoryRecord(name, assessment, note = 'Synced to Sheet') {
    if (!historyList) return;
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fff; border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 8px; font-size: 0.85rem;';
    row.innerHTML = `
      <div>
        <strong>${name}</strong> — ${window.APP_CONFIG.formatINR(assessment.input.requestedLoanAmount)} requested
        <div style="font-size: 0.75rem; color: var(--color-text-muted);">${new Date().toLocaleTimeString()} • ${note}</div>
      </div>
      <span style="font-weight: 700; color: ${assessment.isEligible ? 'var(--color-success)' : 'var(--color-danger)'};">
        ${assessment.status}
      </span>
    `;
    historyList.prepend(row);
  }
});
