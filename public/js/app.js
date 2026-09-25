/**
 * Main Application Orchestrator
 * Tab switcher, mobile navigation, global notifications, and health monitor
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
    <span style="font-weight: 800; font-size: 1.05rem;">${iconMap[type] || 'ℹ'}</span>
    <span style="flex: 1; line-height: 1.4;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Tab alias resolution mapping
const TAB_ALIASES = {
  '': 'tab-home',
  '/': 'tab-home',
  '#': 'tab-home',
  'home': 'tab-home',
  'tab-home': 'tab-home',
  'loan': 'tab-loan-checker',
  'loan-checker': 'tab-loan-checker',
  'loan-eligibility': 'tab-loan-checker',
  'eligibility': 'tab-loan-checker',
  'eligibility-checker': 'tab-loan-checker',
  'tab-loan-checker': 'tab-loan-checker',
  'tab-loan': 'tab-loan-checker',
  'credit': 'tab-credit-analyzer',
  'credit-analyzer': 'tab-credit-analyzer',
  'credit-score': 'tab-credit-analyzer',
  'tab-credit-analyzer': 'tab-credit-analyzer',
  'emi': 'tab-emi-calc',
  'emi-calc': 'tab-emi-calc',
  'emi-calculator': 'tab-emi-calc',
  'tab-emi-calc': 'tab-emi-calc',
  'ai': 'tab-ai-tips',
  'ai-tips': 'tab-ai-tips',
  'ai-coach': 'tab-ai-tips',
  'tab-ai-tips': 'tab-ai-tips',
  'sheets': 'tab-sheets',
  'sheets-sync': 'tab-sheets',
  'google-sheets': 'tab-sheets',
  'tab-sheets': 'tab-sheets'
};

// Global Tab Switcher
window.switchToTab = function (targetTabId) {
  if (targetTabId === undefined || targetTabId === null) {
    targetTabId = 'tab-home';
  }

  const tabPanels = document.querySelectorAll('.tab-panel');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');

  // Handle numeric index resolution
  let resolvedId = '';
  if (typeof targetTabId === 'number') {
    if (tabPanels[targetTabId]) {
      resolvedId = tabPanels[targetTabId].id;
    }
  } else {
    const raw = String(targetTabId).replace(/^#/, '').trim().toLowerCase();
    resolvedId = TAB_ALIASES[raw] || (raw.startsWith('tab-') ? raw : (raw ? `tab-${raw}` : 'tab-home'));
  }

  // Fallback to tab-home if resolved ID doesn't exist
  let targetPanel = document.getElementById(resolvedId);
  if (!targetPanel && tabPanels.length > 0) {
    resolvedId = 'tab-home';
    targetPanel = document.getElementById(resolvedId) || tabPanels[0];
  }

  // Switch Panels
  tabPanels.forEach((panel) => {
    if (panel.id === resolvedId) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Switch Buttons
  tabButtons.forEach((btn) => {
    const btnTab = btn.getAttribute('data-tab');
    if (btnTab === resolvedId || TAB_ALIASES[btnTab] === resolvedId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Brand active indicator
  const brand = document.querySelector('.brand');
  if (brand) {
    if (resolvedId === 'tab-home') {
      brand.classList.add('active');
    } else {
      brand.classList.remove('active');
    }
  }

  // Close mobile drawer on selection if open
  if (mobileDrawer) {
    mobileDrawer.classList.remove('open');
  }

  // Trigger module-specific refreshes
  if (resolvedId === 'tab-sheets' && typeof window.refreshSheetsSummary === 'function') {
    window.refreshSheetsSummary();
  }

  // Update address bar hash for bookmarking and history without jumping
  if (window.history && window.history.replaceState) {
    const hash = resolvedId === 'tab-home' ? 'home' : resolvedId.replace(/^tab-/, '');
    window.history.replaceState(null, '', `#${hash}`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Theme Manager (Dark Glassmorphism default, Light mode optional)
(function applyInitialTheme() {
  const savedTheme = localStorage.getItem('app-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

function updateThemeToggleButton(theme) {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;
  if (theme === 'light') {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
      <span>Dark Mode</span>
    `;
    toggleBtn.setAttribute('title', 'Switch to Dark Glassmorphism Mode');
  } else {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <span>Light Mode</span>
    `;
    toggleBtn.setAttribute('title', 'Switch to Light Mode');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme Switcher
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeToggleButton(currentTheme);

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme') || 'dark';
      const target = active === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', target);
      localStorage.setItem('app-theme', target);
      updateThemeToggleButton(target);
      window.appToast(`Switched to ${target === 'dark' ? 'Dark Glassmorphism' : 'Clean Light'} theme`, 'info');
    });
  }

  // Bind Tab & Navigation Click Handlers (Navbar tabs, mobile drawer, and elements with data-tab)
  const tabElements = document.querySelectorAll('.tab-btn, [data-tab]');
  tabElements.forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return;
      e.preventDefault();
      const target = el.getAttribute('data-tab');
      if (target) window.switchToTab(target);
    });
  });

  // Global event delegation for all [data-tab] elements
  document.addEventListener('click', (e) => {
    const tabEl = e.target.closest('[data-tab]');
    if (!tabEl) return;
    if (tabEl.tagName === 'INPUT' || tabEl.tagName === 'SELECT' || tabEl.tagName === 'TEXTAREA') return;
    const target = tabEl.getAttribute('data-tab');
    if (target) {
      e.preventDefault();
      window.switchToTab(target);
    }
  });

  // Bind Brand Logo and Home Links
  const homeLinks = document.querySelectorAll('.brand, a[href="#home"], a[href="#tab-home"]');
  homeLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.switchToTab('tab-home');
    });
  });

  // Handle Initial Hash on page load or back/forward navigation
  function handleUrlHash() {
    const raw = (window.location.hash || '').replace('#', '').trim();
    if (raw) {
      window.switchToTab(raw);
    } else {
      window.switchToTab('tab-home');
    }
  }

  handleUrlHash();
  window.addEventListener('hashchange', handleUrlHash);
  window.addEventListener('popstate', handleUrlHash);

  // Mobile Menu Toggle Handler
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');

  if (mobileMenuBtn && mobileNavDrawer) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileNavDrawer.classList.toggle('open');
    });

    // Close when clicking outside drawer
    document.addEventListener('click', (e) => {
      if (!mobileNavDrawer.contains(e.target) && e.target !== mobileMenuBtn) {
        mobileNavDrawer.classList.remove('open');
      }
    });
  }

  // Check Backend Health on Initial Load
  async function checkBackendHealth() {
    const statusIndicator = document.getElementById('system-status-badge');
    try {
      const res = await window.apiClient.get('health');
      if (res && res.success) {
        if (statusIndicator) {
          const aiMode = res.data.integrations.aiProvider === 'claude-3-5-sonnet' ? 'Claude Active' : 'Fallback Engine';
          statusIndicator.innerHTML = `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--color-success); margin-right:4px;"></span> Online (${aiMode})`;
          statusIndicator.style.color = 'var(--color-success-text)';
          statusIndicator.style.background = 'var(--color-success-bg)';
          statusIndicator.style.borderColor = 'var(--color-success-border)';
        }
      }
    } catch (err) {
      if (statusIndicator) {
        statusIndicator.innerHTML = `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--color-danger); margin-right:4px;"></span> Offline`;
        statusIndicator.style.color = 'var(--color-danger-text)';
        statusIndicator.style.background = 'var(--color-danger-bg)';
        statusIndicator.style.borderColor = 'var(--color-danger-border)';
      }
    }
  }

  checkBackendHealth();
});
