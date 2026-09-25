/**
 * Module 5: Google Sheets Assessment Submission UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('sheets-submission-form');
  const summaryBox = document.getElementById('sheets-assessment-summary');
  const historyList = document.getElementById('assessment-history-list');

  const STORAGE_KEY = 'ai_loan_assessment_history';

  // Load and refresh summary when tab is viewed
  function refreshSummary() {
    if (!summaryBox) return;
    const a = window.latestAssessment;
    if (!a) {
      summaryBox.innerHTML = `
        <div style="padding: 16px; background: var(--color-bg-subtle); border: 1px dashed var(--color-border); border-radius: var(--radius-md); text-align: center; color: var(--color-text-muted); font-size: 0.88rem;">
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

  // Retrieve stored assessment records from local storage
  function getLocalHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Save record to local storage
  function saveToLocalHistory(item) {
    try {
      const list = getLocalHistory();
      list.unshift(item);
      if (list.length > 50) list.pop();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }
  }

  // Render a list of assessment records
  function renderHistoryList(records) {
    if (!historyList) return;
    if (!records || records.length === 0) {
      historyList.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--color-text-muted); text-align: center; padding: 24px 0;">
          No records submitted yet in this session.
        </div>
      `;
      return;
    }

    historyList.innerHTML = records.map((rec) => {
      const dateStr = rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
      const isEligible = rec.status === 'Eligible';
      const isCond = rec.status === 'Conditionally Eligible';
      const statusColor = isEligible ? 'var(--color-success)' : (isCond ? 'var(--color-warning)' : 'var(--color-danger)');
      const amountStr = window.APP_CONFIG.formatINR(rec.requestedLoanAmount || 0);

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--color-bg-muted); border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 8px; font-size: 0.85rem; transition: transform 0.15s ease;">
          <div>
            <strong>${rec.applicantName || 'Anonymous Applicant'}</strong> — ${amountStr} requested
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;">
              ${dateStr} • Credit Score: ${rec.creditScore || 'N/A'} • ${rec.note || 'Recorded Assessment'}
            </div>
          </div>
          <span style="font-weight: 700; color: ${statusColor}; font-size: 0.85rem; text-align: right;">
            ${rec.status || 'Evaluated'}
          </span>
        </div>
      `;
    }).join('');
  }

  // Dynamically load history from backend API and/or localStorage
  async function loadAndRenderHistory() {
    let records = [];

    // Attempt retrieval from backend GET /api/assessment/history
    try {
      const res = await window.apiClient.get('assessment/history');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        records = res.data;
      }
    } catch {
      // Fallback to local storage if server endpoint unavailable
    }

    if (records.length === 0) {
      records = getLocalHistory();
    }

    renderHistoryList(records);
  }

  window.loadAssessmentHistory = loadAndRenderHistory;

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

        const isSynced = response.success;
        const note = isSynced ? 'Synced to Sheet' : 'Local Session Only';

        saveToLocalHistory({
          applicantName,
          applicantEmail,
          requestedLoanAmount: assessment.input.requestedLoanAmount,
          monthlyIncome: assessment.input.monthlyIncome,
          creditScore: assessment.input.creditScore,
          status: assessment.status,
          riskTier: assessment.riskTier,
          timestamp: new Date().toISOString(),
          note
        });

        loadAndRenderHistory();

        if (isSynced) {
          window.appToast('Assessment successfully recorded to Google Sheets!', 'success');
        } else {
          window.appToast(response.error || 'Saved to local assessment history (Google Sheets is unconfigured).', 'info');
        }

        form.reset();
      } catch (err) {
        window.appToast(err.message || 'Failed to submit assessment.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Initial load of stored records
  loadAndRenderHistory();
});
