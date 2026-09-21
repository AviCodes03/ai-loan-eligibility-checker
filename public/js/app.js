/**
 * Main Application Orchestrator
 * Tab switcher, global notifications, and health monitor
 */

// Toast notification helper
window.appToast = function (message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span style="font-weight: 800; font-size: 1rem;">${iconMap[type] || 'ℹ'}</span>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Global Tab Switcher
window.switchToTab = function (targetTabId) {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((btn) => {
    if (btn.getAttribute('data-tab') === targetTabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  tabPanels.forEach((panel) => {
    if (panel.id === targetTabId) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  if (targetTabId === 'tab-sheets' && typeof window.refreshSheetsSummary === 'function') {
    window.refreshSheetsSummary();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', () => {
  // Bind Tab Click Handlers
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      if (target) window.switchToTab(target);
    });
  });

  // Check Backend Health on Initial Load
  async function checkBackendHealth() {
    const statusIndicator = document.getElementById('system-status-badge');
    try {
      const res = await window.apiClient.get('health');
      if (res && res.success) {
        if (statusIndicator) {
          const aiMode = res.data.integrations.aiProvider === 'claude-3-5-sonnet' ? 'Claude AI' : 'Rule-Based Fallback';
          statusIndicator.innerHTML = `● System Online • Mode: ${aiMode}`;
          statusIndicator.style.color = 'var(--color-success)';
        }
      }
    } catch (err) {
      if (statusIndicator) {
        statusIndicator.innerHTML = `● Backend Offline (Check Terminal)`;
        statusIndicator.style.color = 'var(--color-danger)';
      }
    }
  }

  checkBackendHealth();
});
