/**
 * Module 2: Credit Score Analyzer UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('credit-analyzer-form');
  const scoreSlider = document.getElementById('credit-score-slider');
  const scoreInput = document.getElementById('credit-score-input');
  const scoreDisplay = document.getElementById('gauge-score');
  const tierDisplay = document.getElementById('gauge-tier');
  const needle = document.getElementById('gauge-needle');
  const resultContainer = document.getElementById('credit-result-container');

  function updateGauge(score) {
    if (!scoreDisplay || !tierDisplay) return;
    scoreDisplay.textContent = score;

    let tier = 'Critical';
    let color = '#ef4444';
    let rotation = 0; // -90 deg to 90 deg (180 deg range)

    // Map 300-900 to -90 to 90 degrees
    const pct = Math.max(0, Math.min(1, (score - 300) / 600));
    rotation = -90 + (pct * 180);

    if (score >= 750) {
      tier = 'Excellent (Low Risk)';
      color = '#10b981';
    } else if (score >= 700) {
      tier = 'Good (Low-Moderate Risk)';
      color = '#3b82f6';
    } else if (score >= 650) {
      tier = 'Fair / Moderate (Standard Terms)';
      color = '#f59e0b';
    } else if (score >= 550) {
      tier = 'Poor (High Risk)';
      color = '#f97316';
    } else {
      tier = 'Critical / Default Risk';
      color = '#ef4444';
    }

    tierDisplay.textContent = tier;
    tierDisplay.style.backgroundColor = `${color}20`;
    tierDisplay.style.color = color;
    tierDisplay.style.border = `1px solid ${color}60`;

    if (needle) {
      needle.style.transform = `rotate(${rotation}deg)`;
    }
  }

  if (scoreSlider && scoreInput) {
    scoreSlider.addEventListener('input', (e) => {
      scoreInput.value = e.target.value;
      updateGauge(e.target.value);
    });

    scoreInput.addEventListener('input', (e) => {
      scoreSlider.value = e.target.value;
      updateGauge(e.target.value);
    });

    updateGauge(scoreSlider.value);
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const creditScore = parseInt(scoreInput.value, 10);
      const onTimePaymentPct = parseFloat(document.getElementById('ontime-payment').value) || 100;
      const creditUtilizationPct = parseFloat(document.getElementById('credit-utilization').value) || 30;
      const creditHistoryMonths = parseInt(document.getElementById('history-length').value, 10) || 24;
      const activeLoansCount = parseInt(document.getElementById('active-accounts').value, 10) || 2;
      const recentInquiriesCount = parseInt(document.getElementById('recent-inquiries').value, 10) || 0;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Analyzing Credit Health...';

      try {
        const response = await window.apiClient.post('credit/analyze', {
          creditScore,
          onTimePaymentPct,
          creditUtilizationPct,
          creditHistoryMonths,
          activeLoansCount,
          recentInquiriesCount
        });

        if (response.success) {
          renderCreditAnalysis(response.data);
          window.appToast('Credit analysis generated successfully!', 'success');
        }
      } catch (err) {
        window.appToast(err.message || 'Failed to analyze credit score.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  function renderCreditAnalysis(data) {
    if (!resultContainer) return;
    resultContainer.style.display = 'block';

    resultContainer.innerHTML = `
      <div class="card" style="margin-top: 16px; border-top: 4px solid var(--color-primary);">
        <h3 class="card-title">Credit Factor Breakdown</h3>
        <p style="font-size: 0.88rem; color: var(--color-text-muted); margin-bottom: 16px;">
          Overall Credit Health Index: <strong>${data.healthIndex}/100</strong>
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${data.factorBreakdown.map((f) => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
                <span>${f.name} (Weight: ${f.weight}%)</span>
                <span style="color: ${f.status === 'Good' ? 'var(--color-success)' : (f.status === 'Moderate' ? 'var(--color-warning)' : 'var(--color-danger)')};">
                  ${f.status} (${f.score} pts)
                </span>
              </div>
              <div style="height: 6px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                <div style="width: ${f.score}%; height: 100%; background: ${f.status === 'Good' ? 'var(--color-success)' : (f.status === 'Moderate' ? 'var(--color-warning)' : 'var(--color-danger)')};"></div>
              </div>
              <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 2px;">${f.detail}</div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 20px;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 6px;">Actionable Improvement Steps:</h4>
          <ul style="padding-left: 20px; font-size: 0.85rem;">
            ${data.recommendations.map((r) => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
