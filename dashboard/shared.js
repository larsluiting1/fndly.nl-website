/* ═══════════════════════════════════════════════
   FNDLY Dashboard — Shared JS
   ═══════════════════════════════════════════════ */

(function () {
  /* ── SIDEBAR TOGGLE (mobile) ── */
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const overlay = document.querySelector('.sidebar-overlay');

  if (toggle) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  if (overlay) {
    overlay.addEventListener('click', () => sidebar.classList.remove('open'));
  }

  /* ── ACTIVE NAV LINK ── */
  const currentPath = location.pathname.replace(/\/$/, '').split('/').pop() || 'index';
  document.querySelectorAll('.sidebar__link').forEach(link => {
    const href = link.getAttribute('href').replace(/\/$/, '').split('/').pop().replace('.html', '') || 'index';
    if (href === currentPath || href === currentPath.replace('.html', '')) {
      link.classList.add('active');
    }
  });

  /* ── TABS ── */
  document.querySelectorAll('[data-tabs]').forEach(tabGroup => {
    const tabs = tabGroup.querySelectorAll('.tab');
    const panels = tabGroup.closest('.card, .content, section')?.querySelectorAll('[data-panel]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (panels) {
          panels.forEach(p => p.hidden = p.dataset.panel !== tab.dataset.tab);
        }
      });
    });
  });

  /* ── ANIMATE NUMBERS ── */
  function animateValue(el, end, duration) {
    const start = 0;
    const startTime = performance.now();
    const isPercent = el.dataset.suffix === '%';
    const isDecimal = String(end).includes('.');

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = start + (end - start) * eased;
      el.textContent = isDecimal ? val.toFixed(1) : Math.round(val).toLocaleString();
      if (isPercent) el.textContent += '%';
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const val = parseFloat(el.dataset.count);
        if (!isNaN(val)) animateValue(el, val, 1200);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));

})();

/* ── CHART HELPERS ── */
const FNDLY_COLORS = {
  accent: '#4F46E5',
  accentLight: 'rgba(79,70,229,0.08)',
  lime: '#B6FF3C',
  limeText: '#65A30D',
  cyan: '#06B6D4',
  violet: '#7C3AED',
  success: '#65A30D',
  warning: '#D97706',
  danger: '#DC2626',
  border: '#E8E8E5',
  muted: '#888888',
  soft: '#F7F7F5',
};

function createLineChart(ctx, labels, datasets, opts) {
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: opts?.legend !== false, position: 'top', align: 'end',
          labels: { boxWidth: 10, boxHeight: 10, borderRadius: 2, padding: 16,
            font: { family: 'Inter', size: 11, weight: '600' }, color: '#888' }
        },
        tooltip: { backgroundColor: '#111', titleFont: { family: 'Inter', size: 12 },
          bodyFont: { family: 'Inter', size: 12 }, padding: 10, cornerRadius: 8,
          boxPadding: 4 },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#bbb', maxRotation: 0 }, border: { display: false } },
        y: { grid: { color: '#f0f0ee' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#bbb', ...(opts?.yCallback ? { callback: opts.yCallback } : {}) }, border: { display: false }, beginAtZero: opts?.beginAtZero !== false },
      },
      elements: { line: { tension: 0.35, borderWidth: 2 }, point: { radius: 0, hoverRadius: 4 } },
      ...opts?.extra,
    },
  });
}

function createBarChart(ctx, labels, datasets, opts) {
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: opts?.legend !== false, position: 'top', align: 'end',
          labels: { boxWidth: 10, boxHeight: 10, borderRadius: 2, padding: 16,
            font: { family: 'Inter', size: 11, weight: '600' }, color: '#888' }
        },
        tooltip: { backgroundColor: '#111', titleFont: { family: 'Inter', size: 12 },
          bodyFont: { family: 'Inter', size: 12 }, padding: 10, cornerRadius: 8, boxPadding: 4 },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#bbb', maxRotation: 0 }, border: { display: false } },
        y: { grid: { color: '#f0f0ee' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#bbb' }, border: { display: false }, beginAtZero: true },
      },
      borderRadius: 5, borderSkipped: false, barPercentage: 0.6,
      ...opts?.extra,
    },
  });
}

function createDoughnutChart(ctx, labels, data, colors, opts) {
  return new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, spacing: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: opts?.cutout || '72%',
      plugins: {
        legend: { display: opts?.legend !== false, position: 'right',
          labels: { boxWidth: 10, boxHeight: 10, borderRadius: 2, padding: 12,
            font: { family: 'Inter', size: 11, weight: '600' }, color: '#888' }
        },
        tooltip: { backgroundColor: '#111', titleFont: { family: 'Inter', size: 12 },
          bodyFont: { family: 'Inter', size: 12 }, padding: 10, cornerRadius: 8 },
      },
      ...opts?.extra,
    },
  });
}
