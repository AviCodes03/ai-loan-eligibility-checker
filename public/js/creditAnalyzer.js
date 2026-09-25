/**
 * Module 2: Credit Score Analyzer UI Logic
 * Synchronizes inputs, drives interactive gauge simulation, and renders
 * structured credit health factor breakdowns with actionable steps.
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
    let color = '#f43f5e';
    let rotation = 0; // -90 deg to 90 deg (180 deg range)

    // Map 300-900 to -90 to 90 degrees
    const pct = Math.max(0, Math.min(1, (score - 300) / 600));
    rotation = -90 + (pct * 180);

    if (score >= 750) {
      tier = 'Excellent (Prime)';
      color = '#10b981';
    } else if (score >= 700) {
      tier = 'Good (Standard)';
      color = '#0ea5e9';
    } else if (score >= 650) {
      tier = 'Fair (Conditional)';
      color = '#f59e0b';
    } else if (score >= 550) {
      tier = 'Poor (High Risk)';
      color = '#f97316';
    } else {
      tier = 'Critical (Default Risk)';
      color = '#f43f5e';
    }

    tierDisplay.textContent = tier;
    tierDisplay.style.backgroundColor = `${color}15`;
    tierDisplay.style.color = color;
    tierDisplay.style.border = `1px solid ${color}40`;

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
      <div class="card" style="margin-top: 16px; border-top: 4px solid var(--color-primary); box-shadow: var(--shadow-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
          <h3 class="card-title" style="margin-bottom: 0;">Credit Health Factor Breakdown</h3>
          <span style="background: var(--color-primary-light); color: var(--color-primary); border: 1px solid var(--color-primary-border); font-size: 0.8rem; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-full);">
            Health Index: ${data.healthIndex}/100
          </span>
        </div>
        <p style="font-size: 0.86rem; color: var(--color-text-muted); margin-bottom: 18px;">
          Deterministic factor analysis across the 5 standard retail credit dimensions.
        </p>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${data.factorBreakdown.map((f) => {
            const statusColor = f.status === 'Good' ? 'var(--color-success)' : (f.status === 'Moderate' ? 'var(--color-warning)' : 'var(--color-danger)');
            return `
              <div style="background: var(--color-bg-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.86rem; font-weight: 700; margin-bottom: 6px;">
                  <span>${f.name} <span style="font-weight: 500; font-size: 0.75rem; color: var(--color-text-muted);">(Weight: ${f.weight}%)</span></span>
                  <span style="color: ${statusColor}; font-size: 0.82rem;">
                    ${f.status} • ${f.score} pts
                  </span>
                </div>
                <div style="height: 6px; background: #e2e8f0; border-radius: var(--radius-full); overflow: hidden; margin-bottom: 6px;">
                  <div style="width: ${f.score}%; height: 100%; background: ${statusColor}; border-radius: var(--radius-full); transition: width 0.6s ease;"></div>
                </div>
                <div style="font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.4;">${f.detail}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--color-border);">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 8px;">
            Actionable Optimization Recommendations:
          </h4>
          <ul class="reasons-list">
            ${data.recommendations.map((r) => `
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${r}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="margin-top: 18px; padding-top: 10px; border-top: 1px solid var(--color-border); font-size: 0.78rem; color: var(--color-text-muted);">
          <em>${data.disclaimer}</em>
        </div>
      </div>
    `;

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
