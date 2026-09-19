/* ==========================================================================
   VJSAR — Animation & Interaction Engine v2
   Cursor glow · Scroll-reveal · 3D tilt · Smooth micro-interactions
   ========================================================================== */

function initApp() {
  initNavbar();
  initCursorGlow();
  initScrollReveal();
  initTiltCards();
  initRotator();
  initCommentTypewriter();
  initIndustryTabs();
  initCalculator();
  initModal();
  initPartnerMarquee();
  initStatCounters();
  initPlatformSlider();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/* ─────────────────────────────────────────────────────────
   1. Navbar — smooth scroll-driven transparent→white fade
   ───────────────────────────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  /**
   * Scroll range over which the navbar fades from fully transparent
   * to fully opaque white. Adjust SCROLL_END to taste.
   */
  const SCROLL_START = 0;
  const SCROLL_END   = 180; // px — fully opaque by this point

  /** Cubic ease-out: snappier at start, settles gently at end */
  function easeOutQuad(t) { return t * (2 - t); }

  let lastScrollY  = -1;
  let rafId        = null;

  function applyNavProgress() {
    const scrollY   = window.scrollY;
    if (scrollY === lastScrollY) { rafId = null; return; }
    lastScrollY = scrollY;

    // Raw linear progress 0→1
    const raw      = Math.min(Math.max((scrollY - SCROLL_START) / (SCROLL_END - SCROLL_START), 0), 1);
    const progress = easeOutQuad(raw);

    // Update CSS variables — browser paints on its own compositor thread
    nav.style.setProperty('--nav-bg',     progress.toFixed(4));
    nav.style.setProperty('--nav-blur',   progress.toFixed(4));
    nav.style.setProperty('--nav-border', progress.toFixed(4));
    nav.style.setProperty('--nav-shadow', progress.toFixed(4));

    // Keep .scrolled for height compaction (JS/CSS still use it)
    nav.classList.toggle('scrolled', scrollY > 40);

    rafId = null;
  }

  window.addEventListener('scroll', () => {
    if (!rafId) rafId = requestAnimationFrame(applyNavProgress);
  }, { passive: true });

  // Run once on load in case page is already scrolled (e.g. browser restore)
  applyNavProgress();
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
    glow.style.top = `${currentY}px`;
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
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    const maxRotate = 6; // degrees
    const rotX = (-dy * maxRotate).toFixed(2);
    const rotY = (dx * maxRotate).toFixed(2);

    card.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
  }

  function resetTilt(e) {
    const card = e.currentTarget;
    card.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.55s ease';
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  }
}

/* ─────────────────────────────────────────────────────────
   5b. Enterprise Console Query Typewriter
   Rotates authentic VJSAR queries with realistic typing & pause
   ───────────────────────────────────────────────────────── */
function initCommentTypewriter() {
  const queryEl = document.getElementById('console-query-text');
  if (!queryEl) return;

  const QUERIES = [
    "Lloyd's Marine policy compliance & clause review",
    "Context DMS: semantic clause reconciliation",
    "Azure UK-South: multi-region cluster health"
  ];
  let qIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function tick() {
    const current = QUERIES[qIdx];
    if (!isDeleting) {
      charIdx++;
      queryEl.textContent = current.slice(0, charIdx);
      if (charIdx === current.length) {
        setTimeout(() => { isDeleting = true; tick(); }, 2800);
        return;
      }
      setTimeout(tick, 28);
    } else {
      charIdx--;
      queryEl.textContent = current.slice(0, charIdx);
      if (charIdx === 0) {
        isDeleting = false;
        qIdx = (qIdx + 1) % QUERIES.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 16);
    }
  }

  // Start after card entrance settles
  setTimeout(tick, 900);
}

/* ─────────────────────────────────────────────────────────
   6. Hero Rotating Text
   ───────────────────────────────────────────────────────── */
function initRotator() {
  const el = document.getElementById('rotator');
  if (!el) return;

  const terms = [
    'Low Code<br>Platforms',
    'Cloud &amp;<br>Azure',
    'AI &amp; Machine<br>Learning',
    'App<br>Modernisation',
    'Data &amp;<br>Analytics',
    'SRE &amp;<br>DevOps',
    'Quality<br>Assurance'
  ];
  let i = 0;

  setInterval(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => {
      i = (i + 1) % terms.length;
      el.innerHTML = terms[i];
      el.style.opacity = '1';
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
        { icon: 'fa-file-shield', title: 'Compliance Framework', sub: 'Solvency II · FCA · GDPR Ready' },
        { icon: 'fa-robot', title: 'AI Claims Automation', sub: 'FNOL to Settlement in Minutes' },
        { icon: 'fa-cloud', title: 'Azure Cloud Migration', sub: '99.9% Uptime · Zero-Downtime Cutover' },
        { icon: 'fa-chart-line', title: 'Analytics Dashboard', sub: 'Real-time Risk & Pricing Insights', green: true }
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
        { icon: 'fa-lock', title: 'API Security Layer', sub: 'OAuth2 · mTLS · Zero Trust' },
        { icon: 'fa-exchange-alt', title: 'Open Banking APIs', sub: 'PSD2 Compliant Integration' },
        { icon: 'fa-database', title: 'Core Systems Refactor', sub: 'Microservices · Event Sourcing' },
        { icon: 'fa-chart-pie', title: 'AML Analytics', sub: 'Real-time Transaction Monitoring', green: true }
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
        { icon: 'fa-server', title: 'Data Engineering', sub: 'Azure Data Factory · Databricks' },
        { icon: 'fa-chart-bar', title: 'BI Reporting', sub: 'Power BI · Real-time Dashboards' },
        { icon: 'fa-balance-scale', title: 'Compliance Automation', sub: 'MiFID II · GDPR · SOX Ready' },
        { icon: 'fa-shield-alt', title: 'DR & Resilience', sub: 'Multi-Cloud Failover Strategy', green: true }
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
        { icon: 'fa-hospital', title: 'EHR Integration', sub: 'HL7 FHIR · DICOM Standards' },
        { icon: 'fa-stethoscope', title: 'Clinical AI Models', sub: 'Diagnostic & Risk Prediction' },
        { icon: 'fa-lock', title: 'HIPAA Data Vault', sub: 'End-to-End Encryption at Rest' },
        { icon: 'fa-microscope', title: 'HealthTech QA', sub: 'FDA-Grade Testing Pipelines', green: true }
      ]
    }
  };

  const tabBtns = document.querySelectorAll('.tab-btn');
  const indTitle = document.getElementById('ind-title');
  const indDesc = document.getElementById('ind-desc');
  const indList = document.getElementById('ind-list');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const key = btn.dataset.industry;
      const d = data[key];
      if (!d) return;

      const panel = document.querySelector('.industry-panel');
      if (panel) {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(12px)';
      }

      setTimeout(() => {
        if (indTitle) indTitle.textContent = d.title;
        if (indDesc) indDesc.textContent = d.desc;
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
  const timeEl = document.getElementById('calc-time');

  function animateValue(el, target) {
    if (!el) return;
    const current = parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0;
    const diff = target - current;
    const steps = 28;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = `$${Math.round(current + diff * eased).toLocaleString()}`;
      if (step >= steps) clearInterval(timer);
    }, 16);
  }

  function update() {
    const total = Math.round(scope * size * speed);
    const wMin = Math.round(total / 5500);
    const wMax = wMin + 3;
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
      if (group === 'size') size = val;
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
  const form = document.getElementById('contact-form');
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

/* ─────────────────────────────────────────────────────────
   P7. Strategic Partners & Accreditations Interactive Marquee
   - Smooth continuous automatic flow right-to-left
   - Seamless infinite loop across all resolutions & zoom levels
   ───────────────────────────────────────────────────────── */
function initPartnerMarquee() {
  const marquee = document.getElementById('partner-marquee');
  const track = document.getElementById('marquee-track');
  if (!marquee || !track) return;

  const firstGroup = track.querySelector('.marquee-group');
  if (!firstGroup) return;

  let currentX = 0;
  const AUTO_SPEED = -1.1; // Default smooth right-to-left flow speed
  let rafId = null;

  function getGroupWidth() {
    return firstGroup.offsetWidth || 1200;
  }

  // Animation Loop — constant speed
  function tick() {
    const groupWidth = getGroupWidth();

    currentX += AUTO_SPEED;

    // Seamless infinite wrap around
    if (groupWidth > 0) {
      while (currentX <= -groupWidth) currentX += groupWidth;
      while (currentX > 0) currentX -= groupWidth;
    }

    track.style.transform = `translate3d(${currentX}px, 0, 0)`;
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
}

/* ───────────────────────────────────────────────────────────
   Hero Stat Counters — smooth ease-out expo count-up from 0
   Triggered once on viewport entry via IntersectionObserver.
   Respects prefers-reduced-motion: shows final values instantly.
   ─────────────────────────────────────────────────────────── */
function initStatCounters() {
  const statEls = document.querySelectorAll('.stat-val[data-count], .metric-val[data-count]');
  if (!statEls.length) return;

  // Check reduced-motion preference once
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Ease-out expo: rockets off from 0 then glides smoothly into the final value.
   * Much more premium and satisfying than cubic — accelerates hard through the
   * early phase then decelerates gracefully to land exactly on target.
   * t is progress 0–1, returns eased 0–1.
   */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  /**
   * Animate a single stat element from 0 to its target value.
   * @param {Element} el        - The .stat-val / .metric-val element
   * @param {number}  target    - Final numeric value
   * @param {number}  decimals  - Decimal places to display
   * @param {number}  duration  - Total animation duration in ms
   */
  function animateCounter(el, target, decimals, duration) {
    const numEl = el.querySelector('.stat-num');
    if (!numEl) return;

    // Always reset to zero so the count-up starts cleanly from 0
    numEl.textContent = (0).toFixed(decimals);

    // If reduced motion is preferred, snap straight to the final value
    if (prefersReduced) {
      numEl.textContent = target.toFixed(decimals);
      return;
    }

    let rafId = null;
    const startTime = performance.now();

    function tick(now) {
      const elapsed       = now - startTime;
      const rawProgress   = Math.min(elapsed / duration, 1); // clamp 0–1
      const easedProgress = easeOutExpo(rawProgress);
      const current       = easedProgress * target;

      numEl.textContent = current.toFixed(decimals);

      if (rawProgress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Lock to exact final value — no floating-point drift
        numEl.textContent = target.toFixed(decimals);
        rafId = null;
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  // Use IntersectionObserver so animation fires when stats enter viewport
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el       = entry.target;
      const target   = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals ?? '0', 10);

      // Stagger each stat slightly for a polished cascade effect
      const index    = Array.from(statEls).indexOf(el);
      const delay    = index * 150; // ms between each stat starting
      const duration = 2000;        // total count-up duration per stat

      setTimeout(() => animateCounter(el, target, decimals, duration), delay);

      // Observe only once per stat
      obs.unobserve(el);
    });
  }, {
    threshold: 0.3, // trigger when 30% of the stats strip is visible
  });

  statEls.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────
   Platform Card Slider — 3 visible, prev/next nav, 1/2 counter
   ───────────────────────────────────────────────────────── */
function initPlatformSlider() {
  const track    = document.getElementById('pfTrack');
  const viewport = document.getElementById('pfViewport');
  const prevBtn  = document.getElementById('pfPrev');
  const nextBtn  = document.getElementById('pfNext');
  const counter  = document.getElementById('pfCounter');

  if (!track || !prevBtn || !nextBtn) return;

  const cards     = Array.from(track.querySelectorAll('.pf-card'));
  const TOTAL     = cards.length;       // 4
  const VISIBLE   = 3;
  const MAX_PAGE  = TOTAL - VISIBLE;    // 1 (page 0 = cards 0-2, page 1 = cards 1-3)

  let page = 0; // 0-indexed offset

  function getCardWidth() {
    if (!cards[0]) return 0;
    const style = getComputedStyle(track);
    const gap   = parseFloat(style.gap) || 20;
    return cards[0].offsetWidth + gap;
  }

  function render() {
    const offset = page * getCardWidth();
    track.style.transform = `translateX(-${offset}px)`;

    // Counter: "1 / 2" or "2 / 2"
    counter.textContent = `${page + 1} / ${MAX_PAGE + 1}`;

    // Button states
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page === MAX_PAGE;

    // Visual: active page = next btn filled when on page 0
    nextBtn.classList.toggle('active-page', page === 0);
  }

  prevBtn.addEventListener('click', () => {
    if (page > 0) { page--; render(); }
  });

  nextBtn.addEventListener('click', () => {
    if (page < MAX_PAGE) { page++; render(); }
  });

  render(); // initial state

  // Lock content width to base card size — card shell grows, text never reflows
  function setBaseWidth() {
    if (!cards[0]) return;
    const w = cards[0].offsetWidth;
    track.querySelectorAll('.pf-card-content').forEach(el => {
      el.style.width = w + 'px';
    });
  }
  // Run after first paint so card widths are measured correctly
  requestAnimationFrame(() => { requestAnimationFrame(setBaseWidth); });
  window.addEventListener('resize', setBaseWidth);

  // ── Video hover play/pause ──────────────────────────────────
  // Browsers won't autoplay invisible videos — must call .play() explicitly
  cards.forEach(card => {
    const video = card.querySelector('.pf-card-video');
    if (!video) return;

    video.preload = 'auto';
    let resetTimer = null;

    card.addEventListener('mouseenter', () => {
      // Cancel any pending reset from a previous mouseleave
      if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
      video.currentTime = 0;
      video.play().catch(() => {});
    });

    card.addEventListener('mouseleave', () => {
      video.pause();
      // Delay reset until AFTER the 0.55s CSS opacity fade-out finishes
      // Resetting immediately causes a flash of frame-0 while video is still visible
      resetTimer = setTimeout(() => {
        video.currentTime = 0;
        resetTimer = null;
      }, 620);
    });
  });
}
