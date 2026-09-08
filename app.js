/* ==========================================================================
   VJSAR — Animation & Interaction Engine v2
   Cursor glow · Scroll-reveal · 3D tilt · Smooth micro-interactions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCursorGlow();
  initScrollReveal();
  initTiltCards();
  initRotator();
  initIndustryTabs();
  initCalculator();
  initModal();
});

/* ─────────────────────────────────────────────────────────
   1. Navbar — scroll compact effect
   ───────────────────────────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────
   2. Cursor Glow — tracks mouse, smoothly follows
   ───────────────────────────────────────────────────────── */
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  }, { passive: true });

  // Smooth lerp animation loop
  function lerpGlow() {
    const ease = 0.10;
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;
    glow.style.left = `${currentX}px`;
    glow.style.top  = `${currentY}px`;
    requestAnimationFrame(lerpGlow);
  }
  lerpGlow();
}

/* ─────────────────────────────────────────────────────────
   3. Scroll Reveal — Intersection Observer
   ───────────────────────────────────────────────────────── */
function initScrollReveal() {
  const selectors = [
    '.reveal',
    '.reveal-left',
    '.reveal-right',
    '.reveal-scale',
    '.reveal-stagger'
  ];

  const allElements = document.querySelectorAll(selectors.join(','));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Unobserve after animation fires once
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  allElements.forEach(el => observer.observe(el));

  // Mark hero elements as visible immediately (already in viewport)
  setTimeout(() => {
    document.querySelectorAll('.hero .reveal, .hero .reveal-stagger, .hero .reveal-right').forEach(el => {
      el.classList.add('visible');
    });
  }, 100);
}

/* ─────────────────────────────────────────────────────────
   4. 3D Tilt on Cards — follows cursor within card bounds
   ───────────────────────────────────────────────────────── */
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', handleTilt);
    card.addEventListener('mouseleave', resetTilt);
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'box-shadow 0.3s ease';
    });
  });

  function handleTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    const maxRotate = 6; // degrees
    const rotX = (-dy * maxRotate).toFixed(2);
    const rotY = ( dx * maxRotate).toFixed(2);

    card.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';
    card.style.transform  = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
  }

  function resetTilt(e) {
    const card = e.currentTarget;
    card.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.55s ease';
    card.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  }
}

/* ─────────────────────────────────────────────────────────
   5. Hero Rotating Text
   ───────────────────────────────────────────────────────── */
function initRotator() {
  const el = document.getElementById('rotator');
  if (!el) return;

  const terms = [
    'Cloud & Azure',
    'AI & Machine Learning',
    'App Modernisation',
    'Data & Analytics',
    'SRE & DevOps',
    'Low Code Platforms',
    'Quality Assurance'
  ];
  let i = 0;

  setInterval(() => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => {
      i = (i + 1) % terms.length;
      el.textContent    = terms[i];
      el.style.opacity  = '1';
      el.style.transform = 'translateY(0)';
    }, 280);
  }, 2800);
}

/* ─────────────────────────────────────────────────────────
   6. Industry Tabs
   ───────────────────────────────────────────────────────── */
function initIndustryTabs() {
  const data = {
    insurance: {
      title: 'Insurance & Claims Modernisation',
      desc: 'Empowering insurers with intelligent automation, Context Claim processing, legacy refactoring, and AI-assisted underwriting.',
      benefits: [
        'Automated Claims Intake via Context DMS',
        'Legacy Policy Admin Modernisation to Azure',
        'Real-time Fraud Detection & Risk Analytics',
        'Solvency II & FCA Compliance Architectures'
      ],
      rows: [
        { icon: 'fa-file-shield',  title: 'Compliance Framework', sub: 'Solvency II · FCA · GDPR Ready' },
        { icon: 'fa-robot',        title: 'AI Claims Automation',  sub: 'FNOL to Settlement in Minutes' },
        { icon: 'fa-cloud',        title: 'Azure Cloud Migration', sub: '99.9% Uptime · Zero-Downtime Cutover' },
        { icon: 'fa-chart-line',   title: 'Analytics Dashboard',   sub: 'Real-time Risk & Pricing Insights', green: true }
      ]
    },
    banking: {
      title: 'Banking & Core Financial Platforms',
      desc: 'Accelerating digital banking with microservices, open banking APIs, and high-frequency transaction security.',
      benefits: [
        'Secure Open Banking API Integration',
        'Core Banking App Modernisation (zero downtime)',
        'SRE & 99.999% Reliability for Critical Systems',
        'Real-time AML & Compliance Monitoring'
      ],
      rows: [
        { icon: 'fa-lock',          title: 'API Security Layer',   sub: 'OAuth2 · mTLS · Zero Trust' },
        { icon: 'fa-exchange-alt',  title: 'Open Banking APIs',    sub: 'PSD2 Compliant Integration' },
        { icon: 'fa-database',      title: 'Core Systems Refactor', sub: 'Microservices · Event Sourcing' },
        { icon: 'fa-chart-pie',     title: 'AML Analytics',         sub: 'Real-time Transaction Monitoring', green: true }
      ]
    },
    finance: {
      title: 'Financial Services & Asset Management',
      desc: 'Transforming wealth management and enterprise reporting with scalable cloud data pipelines.',
      benefits: [
        'High-Speed Data Pipelines for Market Analytics',
        'Automated Financial Compliance & Audit Logging',
        'Low-Code Portals for Portfolio Managers',
        'Multi-Cloud DR & Security Assurance'
      ],
      rows: [
        { icon: 'fa-server',         title: 'Data Engineering',     sub: 'Azure Data Factory · Databricks' },
        { icon: 'fa-chart-bar',      title: 'BI Reporting',         sub: 'Power BI · Real-time Dashboards' },
        { icon: 'fa-balance-scale',  title: 'Compliance Automation', sub: 'MiFID II · GDPR · SOX Ready' },
        { icon: 'fa-shield-alt',     title: 'DR & Resilience',      sub: 'Multi-Cloud Failover Strategy', green: true }
      ]
    },
    healthcare: {
      title: 'Healthcare & Life Sciences Tech',
      desc: 'Delivering HIPAA-compliant cloud architectures, patient record digitisation, and secure clinical data integration.',
      benefits: [
        'HIPAA & GDPR Compliant Cloud Data Vaults',
        'EHR/EMR System Integration & Interoperability APIs',
        'AI-Driven Predictive Diagnostics & Analytics',
        'Automated QA & Security for HealthTech Apps'
      ],
      rows: [
        { icon: 'fa-hospital',     title: 'EHR Integration',  sub: 'HL7 FHIR · DICOM Standards' },
        { icon: 'fa-stethoscope',  title: 'Clinical AI Models', sub: 'Diagnostic & Risk Prediction' },
        { icon: 'fa-lock',         title: 'HIPAA Data Vault',  sub: 'End-to-End Encryption at Rest' },
        { icon: 'fa-microscope',   title: 'HealthTech QA',     sub: 'FDA-Grade Testing Pipelines', green: true }
      ]
    }
  };

  const tabBtns = document.querySelectorAll('.tab-btn');
  const indTitle = document.getElementById('ind-title');
  const indDesc  = document.getElementById('ind-desc');
  const indList  = document.getElementById('ind-list');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const key = btn.dataset.industry;
      const d   = data[key];
      if (!d) return;

      const panel = document.querySelector('.industry-panel');
      if (panel) {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(12px)';
      }

      setTimeout(() => {
        if (indTitle) indTitle.textContent = d.title;
        if (indDesc)  indDesc.textContent  = d.desc;
        if (indList) {
          indList.innerHTML = d.benefits.map(b =>
            `<li><i class="fas fa-check-circle"></i> ${b}</li>`
          ).join('');
        }

        const visual = document.querySelector('.ind-visual');
        if (visual) {
          visual.innerHTML = d.rows.map(r => `
            <div class="ind-visual-row">
              <div class="ivr-icon${r.green ? '" style="background:var(--green-light);color:var(--green-dark);' : ''}">
                <i class="fas ${r.icon}"></i>
              </div>
              <div>
                <div class="ivr-title">${r.title}</div>
                <div class="ivr-sub">${r.sub}</div>
              </div>
            </div>`
          ).join('');
        }

        if (panel) {
          panel.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1)';
          panel.style.opacity = '1';
          panel.style.transform = 'translateY(0)';
        }
      }, 150);
    });
  });
}

/* ─────────────────────────────────────────────────────────
   7. Project Cost Calculator
   ───────────────────────────────────────────────────────── */
function initCalculator() {
  let scope = 25000, size = 1.5, speed = 1.2;
  const amountEl = document.getElementById('calc-amount');
  const timeEl   = document.getElementById('calc-time');

  function animateValue(el, target) {
    if (!el) return;
    const current = parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0;
    const diff    = target - current;
    const steps   = 28;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = `$${Math.round(current + diff * eased).toLocaleString()}`;
      if (step >= steps) clearInterval(timer);
    }, 16);
  }

  function update() {
    const total = Math.round(scope * size * speed);
    const wMin  = Math.round(total / 5500);
    const wMax  = wMin + 3;
    animateValue(amountEl, total);
    if (timeEl) timeEl.textContent = `Estimated: ${wMin}–${wMax} Weeks`;
  }

  document.querySelectorAll('[data-calc]').forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.dataset.calc;
      document.querySelectorAll(`[data-calc="${group}"]`).forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      const val = parseFloat(chip.dataset.val);
      if (group === 'scope') scope = val;
      if (group === 'size')  size  = val;
      if (group === 'speed') speed = val;
      update();
    });
  });

  update();
}

/* ─────────────────────────────────────────────────────────
   8. Contact Modal
   ───────────────────────────────────────────────────────── */
function initModal() {
  const overlay = document.getElementById('contact-modal');
  const closeBtn = document.getElementById('modal-close');
  const form     = document.getElementById('contact-form');
  if (!overlay) return;

  document.querySelectorAll('.open-modal').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      btn.innerHTML = '<i class="fas fa-check"></i> Request Received!';
      btn.style.background = 'var(--green-dark)';
      btn.style.borderColor = 'var(--green-dark)';
      setTimeout(close, 1800);
    });
  }
}
