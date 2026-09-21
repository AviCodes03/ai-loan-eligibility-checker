/**
 * Module 3: EMI Calculator UI & Interactive Calculations
 */

document.addEventListener('DOMContentLoaded', () => {
  const principalSlider = document.getElementById('emi-amount-slider');
  const principalInput = document.getElementById('emi-amount-input');
  const rateSlider = document.getElementById('emi-rate-slider');
  const rateInput = document.getElementById('emi-rate-input');
  const tenureSlider = document.getElementById('emi-tenure-slider');
  const tenureInput = document.getElementById('emi-tenure-input');

  const monthlyEmiDisplay = document.getElementById('emi-monthly-val');
  const totalInterestDisplay = document.getElementById('emi-total-interest');
  const totalPaymentDisplay = document.getElementById('emi-total-payment');
  const principalBar = document.getElementById('emi-bar-principal');
  const interestBar = document.getElementById('emi-bar-interest');
  const principalPctDisplay = document.getElementById('emi-pct-principal');
  const interestPctDisplay = document.getElementById('emi-pct-interest');
  const tableBody = document.getElementById('amortization-table-body');

  /**
   * Deterministic Standard Reducing Balance EMI Calculation
   */
  function calculateEmi(principal, annualRate, tenureMonths) {
    if (principal <= 0 || tenureMonths <= 0) {
      return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0, principalShare: 100, interestShare: 0, schedule: [] };
    }

    const monthlyRate = (annualRate / 100) / 12;
    let monthlyEmi = 0;

    if (monthlyRate === 0) {
      monthlyEmi = principal / tenureMonths;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);
      monthlyEmi = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
    }

    const totalPayment = monthlyEmi * tenureMonths;
    const totalInterest = Math.max(0, totalPayment - principal);
    const principalShare = (principal / totalPayment) * 100;
    const interestShare = (totalInterest / totalPayment) * 100;

    // Generate Month-by-month Schedule
    const schedule = [];
    let balance = principal;

    for (let m = 1; m <= tenureMonths; m++) {
      const interestPortion = monthlyRate === 0 ? 0 : balance * monthlyRate;
      const principalPortion = monthlyEmi - interestPortion;
      const closingBalance = Math.max(0, balance - principalPortion);

      schedule.push({
        month: m,
        openingBalance: balance,
        emi: monthlyEmi,
        principalPortion,
        interestPortion,
        closingBalance
      });

      balance = closingBalance;
    }

    return {
      monthlyEmi,
      totalPayment,
      totalInterest,
      principalShare,
      interestShare,
      schedule
    };
  }

  function updateEmiView() {
    const principal = parseFloat(principalInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    const tenureMonths = parseInt(tenureInput.value, 10) || 1;

    // Update labels
    document.getElementById('display-emi-amount').textContent = window.APP_CONFIG.formatINR(principal);
    document.getElementById('display-emi-rate').textContent = `${rate.toFixed(1)}%`;
    document.getElementById('display-emi-tenure').textContent = `${tenureMonths} mos (${(tenureMonths / 12).toFixed(1)} yrs)`;

    const res = calculateEmi(principal, rate, tenureMonths);

    if (monthlyEmiDisplay) monthlyEmiDisplay.textContent = window.APP_CONFIG.formatINR(res.monthlyEmi);
    if (totalInterestDisplay) totalInterestDisplay.textContent = window.APP_CONFIG.formatINR(res.totalInterest);
    if (totalPaymentDisplay) totalPaymentDisplay.textContent = window.APP_CONFIG.formatINR(res.totalPayment);

    if (principalBar) principalBar.style.width = `${res.principalShare.toFixed(1)}%`;
    if (interestBar) interestBar.style.width = `${res.interestShare.toFixed(1)}%`;
    if (principalPctDisplay) principalPctDisplay.textContent = `${res.principalShare.toFixed(1)}%`;
    if (interestPctDisplay) interestPctDisplay.textContent = `${res.interestShare.toFixed(1)}%`;

    renderAmortization(res.schedule);
  }

  function renderAmortization(schedule) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    // Show up to the first 24 months + last month for performance in UI
    const displayedRows = schedule.length > 36
      ? [...schedule.slice(0, 24), { isEllipsis: true }, ...schedule.slice(-12)]
      : schedule;

    displayedRows.forEach((row) => {
      const tr = document.createElement('tr');
      if (row.isEllipsis) {
        tr.innerHTML = `<td colspan="6" style="text-align: center; color: var(--color-text-muted); font-style: italic;">... (${schedule.length - 36} intermediate months hidden for brevity) ...</td>`;
      } else {
        tr.innerHTML = `
          <td>Month ${row.month}</td>
          <td>${window.APP_CONFIG.formatINR(row.openingBalance)}</td>
          <td>${window.APP_CONFIG.formatINR(row.emi)}</td>
          <td style="color: var(--color-success);">${window.APP_CONFIG.formatINR(row.principalPortion)}</td>
          <td style="color: var(--color-warning);">${window.APP_CONFIG.formatINR(row.interestPortion)}</td>
          <td>${window.APP_CONFIG.formatINR(row.closingBalance)}</td>
        `;
      }
      tableBody.appendChild(tr);
    });
  }

  // Link sliders and inputs
  function bindPair(slider, input) {
    if (!slider || !input) return;
    slider.addEventListener('input', (e) => {
      input.value = e.target.value;
      updateEmiView();
    });
    input.addEventListener('input', (e) => {
      slider.value = e.target.value;
      updateEmiView();
    });
  }

  bindPair(principalSlider, principalInput);
  bindPair(rateSlider, rateInput);
  bindPair(tenureSlider, tenureInput);

  // Initial calculation
  if (principalInput && rateInput && tenureInput) {
    updateEmiView();
  }
});
