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
  initIndustryFlowchartScroll();
  initCalculator();
  initModal();
  initPartnerMarquee();
  initStatCounters();
  initPlatformSlider();
  initCapabilitiesScrollGrid();
  initLeadershipSpotlight();
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

  // ── Mobile Navigation Toggle ──
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('mobile-open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
      mobileToggle.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    // Close mobile menu when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
      });
    });

    // Close when clicking outside navbar
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && navLinks.classList.contains('mobile-open')) {
        navLinks.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  }
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
   6. Industry Tabs — Enterprise Bento Cockpit Engine
   Apple-style sliding indicator, 4-tier asymmetric Bento matrix,
   animated pipeline flow, and Linear cursor spotlight
   ───────────────────────────────────────────────────────── */
function initIndustryTabs() {
  const data = {
    insurance: {
      domainBadge: '<i class="fas fa-shield-halved"></i> Mission-Critical Insurance',
      title: 'Insurance & Claims Modernisation',
      desc: 'Empowering Lloyd\'s syndicates, global MGAs, and tier-1 carriers with intelligent automation, Context Claim processing, legacy refactoring, and AI-assisted underwriting.',
      pipeline: [
        { step: '01 Ingest', icon: 'fa-inbox', title: 'Broker Intake', sub: 'Context DMS Email & Schedules' },
        { step: '02 Core Engine', icon: 'fa-brain', title: 'AI Clause Matching', sub: 'Automated Risk & FNOL Triage', active: true },
        { step: '03 Governed Gate', icon: 'fa-shield-check', title: 'Pre-Bind Approval', sub: 'Solvency II & Lloyd\'s Gate' }
      ],
      benefits: [
        'Automated Claims Intake via Context DMS & Context Claim',
        'Legacy Policy Admin Modernisation to Azure Cloud',
        'Real-time Fraud Detection & Actuarial Risk Analytics',
        'Solvency II & FCA Compliance Support with Full Audit Lineage'
      ],
      cta: 'Request Industry Brief',
      govHeading: 'Compliance Alignment',
      govSub: 'Controls & Governance Posture',
      govBadge: 'Programme in Progress',
      chips: [
        { text: "Lloyd's — Market Ready", cls: 'chip-green', icon: 'fa-shield-halved' },
        { text: 'ISO 27001 — Control Aligned', cls: 'chip-blue', icon: 'fa-sliders' },
        { text: 'SOC 2 — Designed For', cls: 'chip-cyan', icon: 'fa-drafting-compass' },
        { text: 'GDPR — Residency Ready', cls: 'chip-navy', icon: 'fa-database' }
      ],
      sovText: '100% UK & EU Boundary Enclaves · Built to Support Solvency II & FCA Reporting',
      stat1: { num: '98%', label: 'ACORD & FNOL Confidence' },
      stat2: { num: '<2s', label: 'Average AI Extraction' },
      statNote: '33% treaty claims processed via straight-through processing (STP)',
      techTags: [
        { text: 'Context Insure', cls: 'tag-blue' },
        { text: 'Azure OpenAI', cls: 'tag-purple' },
        { text: 'Context DMS', cls: 'tag-cyan' },
        { text: 'Power Platform', cls: 'tag-green' },
        { text: 'Azure Kubernetes', cls: 'tag-navy' }
      ]
    },
    banking: {
      domainBadge: '<i class="fas fa-university"></i> Tier-1 Core Banking',
      title: 'Banking & Core Financial Platforms',
      desc: 'Accelerating digital retail and corporate banking with cloud-native microservices, open banking APIs, and high-frequency transaction security.',
      pipeline: [
        { step: '01 Ingest', icon: 'fa-exchange-alt', title: 'Open Banking APIs', sub: 'PSD2 & BACS Live Ingestion' },
        { step: '02 Core Engine', icon: 'fa-network-wired', title: 'Event Sourcing Core', sub: 'Kafka & AKS Microservices', active: true },
        { step: '03 Governed Gate', icon: 'fa-lock', title: 'Zero-Trust Gate', sub: 'mTLS & Real-time AML Engine' }
      ],
      benefits: [
        'Secure Open Banking API Integration with OAuth2 & mTLS',
        'Core Banking App Modernisation with Zero-Downtime Cutover',
        'SRE & High-Availability Reliability for Critical Transaction Engines',
        'Real-time AML & Fraud Surveillance with Instant Alerts'
      ],
      cta: 'Request Banking Architecture Brief',
      govHeading: 'Banking Governance & Resilience',
      govSub: 'Regulatory Framework Alignment',
      govBadge: 'Architecture Aligned',
      chips: [
        { text: 'Open Banking — Directory Aligned', cls: 'chip-green', icon: 'fa-building-columns' },
        { text: 'mTLS & OAuth 2.0 — Zero Trust', cls: 'chip-blue', icon: 'fa-lock' },
        { text: 'PRA SS1/21 — Resilience Ready', cls: 'chip-cyan', icon: 'fa-shield-halved' },
        { text: 'BCBS 239 — Lineage Framework', cls: 'chip-navy', icon: 'fa-diagram-project' }
      ],
      sovText: 'Sovereign UK Banking Mesh · HSM Key Enclaves & Client Isolation',
      stat1: { num: '99.99%', label: 'Platform SLA Target' },
      stat2: { num: '<45ms', label: 'P95 API Response Time' },
      statNote: 'Benchmarked across Azure UK-South distributed API gateway clusters',
      techTags: [
        { text: 'Azure Kubernetes', cls: 'tag-navy' },
        { text: 'Terraform IaC', cls: 'tag-purple' },
        { text: 'Kafka Streams', cls: 'tag-blue' },
        { text: 'Redis Cache', cls: 'tag-green' },
        { text: 'Azure Key Vault', cls: 'tag-cyan' }
      ]
    },
    finance: {
      domainBadge: '<i class="fas fa-coins"></i> Capital Markets & Asset Management',
      title: 'Financial Services & Asset Management',
      desc: 'Transforming wealth management, institutional trading, and regulatory reporting with high-speed data pipelines and scalable cloud architecture.',
      pipeline: [
        { step: '01 Ingest', icon: 'fa-chart-line', title: 'Market Feeds', sub: 'Fix Engine & LSE Tick Data' },
        { step: '02 Core Engine', icon: 'fa-server', title: 'Databricks Delta Lake', sub: 'Azure Synapse Data Engineering', active: true },
        { step: '03 Governed Gate', icon: 'fa-balance-scale', title: 'Audit Trail Gate', sub: 'Immutable Ledger & MiFID II Ready' }
      ],
      benefits: [
        'High-Speed Data Pipelines for Real-time Market Analytics',
        'Automated Reporting Frameworks Supporting MiFID II & SOX Compliance',
        'Low-Code Executive Dashboards with Microsoft Power BI',
        'Multi-Cloud Disaster Recovery & 15-Minute RPO/RTO Targets'
      ],
      cta: 'Request Capital Markets Brief',
      govHeading: 'Capital Markets Compliance',
      govSub: 'Client Regulatory & Audit Support',
      govBadge: 'Framework Aligned',
      chips: [
        { text: 'MiFID II — Reporting Automation', cls: 'chip-green', icon: 'fa-scale-balanced' },
        { text: 'SOC 2 — Controls Aligned', cls: 'chip-blue', icon: 'fa-drafting-compass' },
        { text: 'SOX Sec. 404 — ITGC Support', cls: 'chip-cyan', icon: 'fa-file-invoice-dollar' },
        { text: 'FCA Consumer Duty — Data Ready', cls: 'chip-navy', icon: 'fa-handshake' }
      ],
      sovText: 'Immutable WORM Audit Storage · Built for Institutional Compliance',
      stat1: { num: '100%', label: 'Immutable Audit Lineage' },
      stat2: { num: '<15min', label: 'Cross-Region Failover RTO' },
      statNote: 'Production architecture for automated transaction reconciliation',
      techTags: [
        { text: 'Azure Synapse', cls: 'tag-blue' },
        { text: 'Databricks', cls: 'tag-purple' },
        { text: 'Power BI Pro', cls: 'tag-green' },
        { text: 'Azure SQL MI', cls: 'tag-navy' },
        { text: 'Event Hubs', cls: 'tag-cyan' }
      ]
    },
    healthcare: {
      domainBadge: '<i class="fas fa-heartbeat"></i> HealthTech & Life Sciences',
      title: 'Healthcare & Clinical Tech Systems',
      desc: 'Delivering NHS and HIPAA-aligned cloud architectures, patient record digitisation, and secure clinical data interoperability for healthcare trusts and HealthTech innovators.',
      pipeline: [
        { step: '01 Ingest', icon: 'fa-hospital-user', title: 'Clinical Intake', sub: 'EHR / EMR & HL7 FHIR Stream' },
        { step: '02 Core Engine', icon: 'fa-stethoscope', title: 'Clinical AI Engine', sub: 'Predictive Triage & OCR Diagnostics', active: true },
        { step: '03 Governed Gate', icon: 'fa-lock', title: 'Security Enclave', sub: 'FIPS 140-2 Key Vault & BAA Ready' }
      ],
      benefits: [
        'NHS DSP Toolkit Aligned Cloud Architecture & Encryption at Rest',
        'EHR/EMR Interoperability via HL7 FHIR & DICOM Standards',
        'AI-Assisted Predictive Medical Document Triage',
        'Continuous Vulnerability Scanning & Healthcare DevSecOps Pipelines'
      ],
      cta: 'Request Healthcare Solution Brief',
      govHeading: 'HealthTech Security & Standards',
      govSub: 'Clinical Governance & Data Protection',
      govBadge: 'Standards Met',
      chips: [
        { text: 'NHS DSP Toolkit — Standards Met', cls: 'chip-green', icon: 'fa-circle-check' },
        { text: 'HIPAA — Security Rule Architecture', cls: 'chip-blue', icon: 'fa-hospital-user' },
        { text: 'HL7 FHIR — Interoperability', cls: 'chip-cyan', icon: 'fa-network-wired' },
        { text: 'ISO 27001 — Controls Aligned', cls: 'chip-navy', icon: 'fa-sliders' }
      ],
      sovText: 'Zero-Trust Patient Data Isolation · 256-Bit Encrypted Data Residency',
      stat1: { num: '256-bit', label: 'AES Encryption (Rest/Transit)' },
      stat2: { num: 'HL7/FHIR', label: 'Clinical Data Standard' },
      statNote: 'Supplier self-assessment aligned to NHS Digital Data Security Standards',
      techTags: [
        { text: 'Azure Health Data', cls: 'tag-blue' },
        { text: 'FHIR Converter', cls: 'tag-cyan' },
        { text: 'Cognitive Services', cls: 'tag-purple' },
        { text: 'Azure Key Vault', cls: 'tag-navy' },
        { text: 'DICOM Service', cls: 'tag-green' }
      ]
    }
  };

  const tabContainer = document.getElementById('bentoTabBar');
  const indicator = document.getElementById('bentoTabIndicator');
  const tabBtns = document.querySelectorAll('.bento-tab-btn');
  const bentoGrid = document.getElementById('bentoCockpitGrid');

  // DOM Elements to update
  const domainBadge = document.getElementById('bento-domain-badge');
  const indTitle = document.getElementById('ind-title');
  const indDesc = document.getElementById('ind-desc');
  const indList = document.getElementById('ind-list');
  const pipelineEl = document.getElementById('bento-pipeline');
  const chipsEl = document.getElementById('bento-compliance-chips');
  const govHeading = document.getElementById('bento-gov-heading');
  const govSub = document.getElementById('bento-gov-sub');
  const govBadge = document.getElementById('bento-gov-badge');
  const sovDesc = document.getElementById('bento-sov-desc');
  const stat1Num = document.getElementById('bento-stat1-num');
  const stat1Lbl = document.getElementById('bento-stat1-label');
  const stat2Num = document.getElementById('bento-stat2-num');
  const stat2Lbl = document.getElementById('bento-stat2-label');
  const statNote = document.getElementById('bento-stat-note');
  const techStackEl = document.getElementById('bento-tech-stack');
  const ctaBtn = document.getElementById('bento-cta-btn');

  // ── Apple-Style Sliding Indicator Position ──
  function updateIndicator(btn) {
    if (!indicator || !btn || !tabContainer) return;
    if (window.innerWidth <= 768) return; // Fallback to button highlight on mobile grid
    const btnRect = btn.getBoundingClientRect();
    const containerRect = tabContainer.getBoundingClientRect();
    const leftOffset = btnRect.left - containerRect.left;
    indicator.style.transform = `translateX(${leftOffset}px)`;
    indicator.style.width = `${btnRect.width}px`;
  }

  // Initial indicator positioning
  const activeBtn = document.querySelector('.bento-tab-btn.active');
  if (activeBtn) {
    requestAnimationFrame(() => updateIndicator(activeBtn));
  }

  // Recalculate indicator on resize
  window.addEventListener('resize', () => {
    const currentActive = document.querySelector('.bento-tab-btn.active');
    if (currentActive) updateIndicator(currentActive);
  });

  // ── Tab Switching & Staggered Recalibration ──
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      updateIndicator(btn);

      const key = btn.dataset.industry;
      const d = data[key];
      if (!d) return;

      const tiles = document.querySelectorAll('.bento-tile');

      // Staggered micro-fade out
      tiles.forEach((tile) => {
        tile.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
        tile.style.opacity = '0.35';
        tile.style.transform = 'translateY(6px)';
      });

      setTimeout(() => {
        // 1. Update Hero Tile Content
        if (domainBadge) domainBadge.innerHTML = d.domainBadge;
        if (indTitle) indTitle.textContent = d.title;
        if (indDesc) indDesc.textContent = d.desc;
        if (ctaBtn) ctaBtn.innerHTML = `<i class="fas fa-arrow-right"></i> ${d.cta}`;

        if (indList) {
          indList.innerHTML = d.benefits.map(b =>
            `<li><i class="fas fa-check-circle"></i> ${b}</li>`
          ).join('');
        }

        // 2. Update Pipeline Nodes
        if (pipelineEl && d.pipeline) {
          pipelineEl.innerHTML = d.pipeline.map((p, idx) => `
            <div class="pipeline-step${p.active ? ' active-step' : ''}">
              <div class="step-badge">${p.step}</div>
              <div class="step-icon"><i class="fas ${p.icon}"></i></div>
              <div class="step-title">${p.title}</div>
              <div class="step-sub">${p.sub}</div>
            </div>
            ${idx < d.pipeline.length - 1 ? `
              <div class="pipeline-connector">
                <span class="pipeline-pulse"></span>
              </div>
            ` : ''}
          `).join('');
        }

        // 3. Update Compliance Chips & Governance Headings
        if (govHeading && d.govHeading) govHeading.textContent = d.govHeading;
        if (govSub && d.govSub) govSub.textContent = d.govSub;
        if (govBadge && d.govBadge) govBadge.textContent = d.govBadge;
        if (sovDesc && d.sovText) sovDesc.textContent = d.sovText;

        if (chipsEl && d.chips) {
          chipsEl.innerHTML = d.chips.map(c => `
            <div class="bento-chip ${c.cls}">
              <i class="fas ${c.icon}"></i> ${c.text}
            </div>
          `).join('');
        }

        // 4. Update Telemetry Metrics
        if (stat1Num) stat1Num.textContent = d.stat1.num;
        if (stat1Lbl) stat1Lbl.textContent = d.stat1.label;
        if (stat2Num) stat2Num.textContent = d.stat2.num;
        if (stat2Lbl) stat2Lbl.textContent = d.stat2.label;
        if (statNote) statNote.textContent = d.statNote;

        // 5. Update Technology Stack Tags
        if (techStackEl && d.techTags) {
          techStackEl.innerHTML = d.techTags.map(t => `
            <span class="tech-tag ${t.cls}">${t.text}</span>
          `).join('');
        }

        // Staggered micro-fade in (Mission Control recalibration sensation)
        tiles.forEach((tile, idx) => {
          setTimeout(() => {
            tile.style.transition = 'opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
            tile.style.opacity = '1';
            tile.style.transform = 'translateY(0)';
          }, idx * 40);
        });
      }, 160);
    });
  });

  // ── Linear-Style Cursor Spotlight Tracking on Bento Tiles ──
  const tiles = document.querySelectorAll('.bento-tile');
  tiles.forEach(tile => {
    tile.addEventListener('mousemove', (e) => {
      const rect = tile.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      tile.style.setProperty('--mouse-x', `${x}px`);
      tile.style.setProperty('--mouse-y', `${y}px`);
    }, { passive: true });
  });
}

/* ─────────────────────────────────────────────────────────
   6b. Industry Flowchart to Bento In-Place Transition & Scroll
   ───────────────────────────────────────────────────────── */
function initIndustryFlowchartScroll() {
  const track = document.getElementById('industryMasterTrack');
  const stickyStage = document.getElementById('industryStickyStage');
  const flowchartLayer = document.getElementById('flowchartLayer');
  const bentoLayer = document.getElementById('bentoLayer');
  const bentoInner = document.getElementById('bentoInnerWrap');
  const cardsRow = document.getElementById('flowchartCardsRow');
  const flowCards = Array.from(document.querySelectorAll('.flow-card'));
  const tabBtns = document.querySelectorAll('.bento-tab-btn');

  if (!track || !stickyStage) return;

  let targetApproachP = 0;
  let currentApproachP = 0;
  let targetPinnedP = 0;
  let currentPinnedP = 0;
  let isTicking = false;

  function onScroll() {
    if (window.innerWidth <= 992) return;

    const stickyTop = 72;
    const rect = track.getBoundingClientRect();
    const stickyH = stickyStage.offsetHeight || (window.innerHeight - stickyTop);
    const maxScrollDist = Math.max(180, track.offsetHeight - stickyH);

    // Approach distance before locking at stickyTop — ample runway for the staircase ripple
    const approachDist = 380;

    // How far we have scrolled during the approach (0 to 1)
    let approachP = 0;
    if (rect.top <= stickyTop) {
      approachP = 1;
    } else if (rect.top >= stickyTop + approachDist) {
      approachP = 0;
    } else {
      approachP = (stickyTop + approachDist - rect.top) / approachDist;
    }

    // How far we have scrolled after locking at stickyTop (0 to 1)
    let pinnedP = 0;
    const scrolledInside = stickyTop - rect.top;
    if (scrolledInside <= 0) {
      pinnedP = 0;
    } else if (scrolledInside >= maxScrollDist) {
      pinnedP = 1;
    } else {
      pinnedP = scrolledInside / maxScrollDist;
    }

    targetApproachP = approachP;
    targetPinnedP = pinnedP;

    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(renderLoop);
    }
  }

  function renderLoop() {
    const diffA = targetApproachP - currentApproachP;
    const diffP = targetPinnedP - currentPinnedP;

    if (Math.abs(diffA) > 0.001 || Math.abs(diffP) > 0.001) {
      currentApproachP += diffA * 0.25;
      currentPinnedP += diffP * 0.25;
      applyState(currentApproachP, currentPinnedP);
      requestAnimationFrame(renderLoop);
    } else {
      currentApproachP = targetApproachP;
      currentPinnedP = targetPinnedP;
      applyState(currentApproachP, currentPinnedP);
      isTicking = false;
    }
  }

  function applyState(approach, pinned) {
    if (window.innerWidth <= 992) return;

    // ── Phase 1: 4 Cards Smooth Staircase Wave (approach 0.00 to 1.00) ──
    // The leftmost grid fades in and ascends first, followed closely by the 2nd, 3rd, and 4th
    // like a smooth forming staircase. Once approach = 1.0, all 4 cards rest at translateY(0)
    // with opacity 1 on the exact same line, spacing, and alignment.
    const TOTAL_CARDS = flowCards.length; // 4
    const CARD_WINDOW = 0.52; // Duration of each card's individual animation window
    const STAGGER = (1 - CARD_WINDOW) / Math.max(1, TOTAL_CARDS - 1); // 0.48 / 3 = 0.16

    flowCards.forEach((card, i) => {
      const start = i * STAGGER;
      const rawProgress = Math.min(1, Math.max(0, (approach - start) / CARD_WINDOW));
      // Ease out cubic for natural deceleration as each stair step arrives into place
      const easeProgress = 1 - Math.pow(1 - rawProgress, 2.6);

      card.style.opacity = `${easeProgress}`;
      card.style.transform = `translateY(${(1 - easeProgress) * 48}px)`;
    });

    if (cardsRow) {
      cardsRow.style.opacity = '1';
      cardsRow.style.transform = 'none';
    }

    // ── Phase 2: Hold Window inside sticky stage (pinned 0.00 to 0.38) ──
    // All 4 grids stay rock-solid in full resting view for at least 2 full scroll ticks
    if (pinned < 0.38) {
      if (flowchartLayer) {
        flowchartLayer.style.display = 'flex';
        flowchartLayer.style.visibility = 'visible';
        flowchartLayer.style.opacity = '1';
        flowchartLayer.style.transform = 'translateY(0)';
        flowchartLayer.style.pointerEvents = 'auto';
      }
      if (bentoLayer) {
        bentoLayer.style.display = 'none';
        bentoLayer.style.visibility = 'hidden';
        bentoLayer.style.opacity = '0';
        bentoLayer.style.pointerEvents = 'none';
      }
    }

    // ── Phase 4: Clean Smooth Fade-Out of Core Verticals (pinned 0.38 to 0.54) ──
    else if (pinned >= 0.38 && pinned < 0.54) {
      const fadeOut = (pinned - 0.38) / 0.16;
      if (flowchartLayer) {
        flowchartLayer.style.display = 'flex';
        flowchartLayer.style.visibility = 'visible';
        flowchartLayer.style.opacity = `${1 - fadeOut}`;
        flowchartLayer.style.transform = `translateY(${-fadeOut * 18}px)`;
        flowchartLayer.style.pointerEvents = 'none';
      }
      if (bentoLayer) {
        bentoLayer.style.display = 'none';
        bentoLayer.style.visibility = 'hidden';
        bentoLayer.style.opacity = '0';
        bentoLayer.style.pointerEvents = 'none';
      }
    }

    // ── Phase 5: Clean Smooth Fade-In of Bento Cockpit (pinned 0.54 to 0.70) ──
    else if (pinned >= 0.54 && pinned < 0.70) {
      const fadeIn = (pinned - 0.54) / 0.16;
      if (flowchartLayer) {
        flowchartLayer.style.display = 'none';
        flowchartLayer.style.visibility = 'hidden';
        flowchartLayer.style.opacity = '0';
        flowchartLayer.style.pointerEvents = 'none';
      }
      if (bentoLayer) {
        bentoLayer.style.display = 'flex';
        bentoLayer.style.visibility = 'visible';
        bentoLayer.style.opacity = `${fadeIn}`;
        bentoLayer.style.transform = `translateY(${(1 - fadeIn) * 14}px)`;
        bentoLayer.style.pointerEvents = fadeIn > 0.4 ? 'auto' : 'none';
      }
      if (bentoInner) {
        bentoInner.style.transform = 'none';
      }
    }

    // ── Phase 6: Bento Cockpit 100% Solid & Active (pinned 0.70 to 1.00) ──
    else if (pinned >= 0.70) {
      if (flowchartLayer) {
        flowchartLayer.style.display = 'none';
        flowchartLayer.style.visibility = 'hidden';
        flowchartLayer.style.opacity = '0';
        flowchartLayer.style.pointerEvents = 'none';
      }
      if (bentoLayer) {
        bentoLayer.style.display = 'flex';
        bentoLayer.style.visibility = 'visible';
        bentoLayer.style.opacity = '1';
        bentoLayer.style.pointerEvents = 'auto';
        bentoLayer.style.transform = 'translateY(0)';
      }
      if (bentoInner) {
        const stickyH = stickyStage.offsetHeight || (window.innerHeight - 72);
        const overflow = Math.max(0, bentoInner.offsetHeight - stickyH + 84);
        if (overflow > 0 && pinned > 0.72) {
          const panP = Math.min(1, Math.max(0, (pinned - 0.72) / 0.24));
          const easedPan = panP * panP * (3 - 2 * panP);
          bentoInner.style.transform = `translateY(${-easedPan * overflow}px)`;
        } else {
          bentoInner.style.transform = 'none';
        }
      }
    }
  }

  // ── Header "Industries" Navigation Click Handler ──
  // Scrolls smoothly to the exact point where all 4 grids are fully risen up in Image 1
  document.querySelectorAll('a[href="#industries"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const rect = track.getBoundingClientRect();
      const topPos = rect.top + window.scrollY - 72;
      window.scrollTo({
        top: topPos,
        behavior: 'smooth'
      });
    });
  });

  // Card click interaction: Clicking a classification card transitions to Bento Cockpit & activates that tab!
  flowCards.forEach(card => {
    card.addEventListener('click', () => {
      const industry = card.dataset.industry;
      if (!industry) return;

      // Find matching bento tab and click it
      const targetBtn = Array.from(tabBtns).find(btn => btn.dataset.industry === industry);
      if (targetBtn) {
        targetBtn.click();
      }

      // Smooth scroll to Bento phase (p = 0.75)
      const rect = track.getBoundingClientRect();
      const stickyH = stickyStage.offsetHeight || (window.innerHeight - 72);
      const maxScrollDist = Math.max(180, track.offsetHeight - stickyH);
      const targetScroll = rect.top + window.scrollY - 72 + (0.75 * maxScrollDist);

      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 992) {
      if (flowchartLayer) {
        flowchartLayer.style.opacity = '1';
        flowchartLayer.style.transform = 'none';
        flowchartLayer.style.pointerEvents = 'auto';
      }
      if (bentoLayer) {
        bentoLayer.style.opacity = '1';
        bentoLayer.style.transform = 'none';
        bentoLayer.style.pointerEvents = 'auto';
      }
      if (cardsRow) {
        cardsRow.style.opacity = '1';
        cardsRow.style.transform = 'none';
      }
      flowCards.forEach(card => {
        card.style.opacity = '1';
        card.style.transform = 'none';
      });
    } else {
      onScroll();
    }
  });

  // Initial scroll update
  onScroll();
}

/* ─────────────────────────────────────────────────────────
   7. Project Cost Calculator
   ───────────────────────────────────────────────────────── */
function initCalculator() {
  const amountEl = document.getElementById('calc-amount');
  const timeEl = document.getElementById('calc-time');
  if (!amountEl && !document.querySelector('[data-calc]')) return;
  let scope = 25000, size = 1.5, speed = 1.2;

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

    // Visual: filled blue button indicates the primary action direction
    nextBtn.classList.toggle('active-page', page === 0);
    prevBtn.classList.toggle('active-page', page === MAX_PAGE);
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
  window.addEventListener('resize', () => {
    setBaseWidth();
    render();
  });

  // ── Video hover play/pause ──────────────────────────────────
  cards.forEach(card => {
    const video = card.querySelector('.pf-card-video');
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    // Start playback eagerly so frames are decoded and ready when hovered
    const safePlay = () => {
      video.muted = true;
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    };
    safePlay();

    let resetTimer = null;

    const onEnter = () => {
      card.classList.add('is-hovered');
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
      }
      safePlay();
    };

    const onLeave = () => {
      card.classList.remove('is-hovered');
      // No abrupt seek or freeze; video continues smooth muted loop
    };

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointerleave', onLeave);
  });
}

/* ─────────────────────────────────────────────────────────
   13. Capabilities Pinned Dual-Track Horizontal Parallax
   Award-Winning Multi-Row Horizontal Stream (Awwwards SOTD)
   Pattern: Pinned Multi-Track Parallax Rails
   ───────────────────────────────────────────────────────── */
function initCapabilitiesScrollGrid() {
  const track = document.getElementById('svcScrollTrack');
  const viewport = document.getElementById('svcDualViewport');
  const row1 = document.getElementById('svcTrackRow1');
  const row2 = document.getElementById('svcTrackRow2');
  if (!track || !viewport || !row1 || !row2) return;

  const card3 = row1.querySelector('[data-card="3"]');
  const card5 = row2.querySelector('[data-card="5"]');

  let cardWidth = 0;
  let gap = 18.4; // 1.15rem ~ 18.4px
  let maxShift = 0;
  let targetShift = 0;
  let currentShift = 0;
  let targetFade = 1.0;
  let currentFade = 1.0;
  let isTicking = false;

  function measure() {
    if (window.innerWidth <= 900) {
      viewport.style.removeProperty('--svc-card-w');
      row1.style.removeProperty('--row1-tx');
      row2.style.removeProperty('--row2-tx');
      if (card3) {
        card3.style.removeProperty('opacity');
        card3.style.removeProperty('pointer-events');
      }
      if (card5) {
        card5.style.removeProperty('opacity');
        card5.style.removeProperty('pointer-events');
      }
      return;
    }

    const containerW = viewport.offsetWidth;
    gap = 18.4;
    cardWidth = Math.floor((containerW - 2 * gap) / 3);
    viewport.style.setProperty('--svc-card-w', `${cardWidth}px`);

    // Distance required so Row 1 (moving right) reveals Card 4 on left,
    // and Row 2 (moving left) reveals Card 8 on right
    maxShift = cardWidth + gap;

    onScroll();
  }

  function onScroll() {
    if (window.innerWidth <= 900) return;

    const stickyTop = 100; // sticky top offset in px
    const rect = track.getBoundingClientRect();
    const stickyViewport = document.getElementById('svcStickyViewport');
    const stickyH = (stickyViewport ? stickyViewport.offsetHeight : 0) || 500;

    // Available distance to scroll through while sticky element is active inside track
    // Uses true physical distance (track height minus sticky element height) — immune to zoom/windowH
    const maxScrollDist = Math.max(120, rect.height - stickyH);

    // Distance scrolled past the point where the sticky grid locks at stickyTop
    const scrolledInside = stickyTop - rect.top;

    let rawP = 0;
    if (scrolledInside <= 0) {
      rawP = 0;
    } else if (scrolledInside >= maxScrollDist) {
      rawP = 1;
    } else {
      rawP = scrolledInside / maxScrollDist;
    }

    // Deadband buffers:
    // 0.00 to 0.22: Resting with Cards 1-3 & 5-7 in initial view
    // 0.22 to 0.85: Smooth criss-cross horizontal stream (Row 1 -> right, Row 2 -> left)
    // 0.85 to 1.00: Cards 4, 1, 2 & 6, 7, 8 rest cleanly in place
    const START_BUFFER = 0.22;
    const END_BUFFER = 0.85;

    let p = 0;
    if (rawP <= START_BUFFER) {
      p = 0;
    } else if (rawP >= END_BUFFER) {
      p = 1;
    } else {
      p = (rawP - START_BUFFER) / (END_BUFFER - START_BUFFER);
    }

    // Award-winning smooth cubic easing
    const ease = p < 0.5
      ? 4 * p * p * p
      : 1 - Math.pow(-2 * p + 2, 3) / 2;

    targetShift = ease * maxShift;
    targetFade = Math.max(0, 1 - p * 2.0);

    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(renderLoop);
    }
  }

  function renderLoop() {
    const diff = targetShift - currentShift;
    const fadeDiff = targetFade - currentFade;

    if (Math.abs(diff) > 0.3 || Math.abs(fadeDiff) > 0.01) {
      currentShift += diff * 0.14; // silky momentum lerp
      currentFade += fadeDiff * 0.14;

      // Criss-cross motion:
      // Row 1 moves from left to right (-(maxShift - currentShift) -> goes towards 0)
      // Row 2 moves from right to left (-currentShift -> goes towards -maxShift)
      const tx1 = -(maxShift - currentShift);
      const tx2 = -currentShift;

      row1.style.setProperty('--row1-tx', `${tx1.toFixed(1)}px`);
      row2.style.setProperty('--row2-tx', `${tx2.toFixed(1)}px`);

      if (card3) {
        card3.style.opacity = currentFade.toFixed(2);
        card3.style.pointerEvents = currentFade < 0.1 ? 'none' : 'auto';
      }
      if (card5) {
        card5.style.opacity = currentFade.toFixed(2);
        card5.style.pointerEvents = currentFade < 0.1 ? 'none' : 'auto';
      }

      requestAnimationFrame(renderLoop);
    } else {
      currentShift = targetShift;
      currentFade = targetFade;

      const tx1 = -(maxShift - currentShift);
      const tx2 = -currentShift;

      row1.style.setProperty('--row1-tx', `${tx1.toFixed(1)}px`);
      row2.style.setProperty('--row2-tx', `${tx2.toFixed(1)}px`);

      if (card3) {
        card3.style.opacity = currentFade.toFixed(2);
        card3.style.pointerEvents = currentFade < 0.1 ? 'none' : 'auto';
      }
      if (card5) {
        card5.style.opacity = currentFade.toFixed(2);
        card5.style.pointerEvents = currentFade < 0.1 ? 'none' : 'auto';
      }

      isTicking = false;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);

  requestAnimationFrame(() => {
    measure();
    onScroll();
  });
  setTimeout(measure, 150);
}

/* ─────────────────────────────────────────────────────────
   13. Executive Leadership Interactive Spotlight
   ───────────────────────────────────────────────────────── */
function initLeadershipSpotlight() {
  const btns = Array.from(document.querySelectorAll('.exec-selector-btn'));
  const panels = Array.from(document.querySelectorAll('.spotlight-panel'));
  if (!btns.length || !panels.length) return;

  function activateMember(targetKey) {
    btns.forEach(btn => {
      const match = btn.getAttribute('data-exec-target') === targetKey;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    panels.forEach(panel => {
      const match = panel.id === `panel-${targetKey}`;
      if (match) {
        panel.style.display = 'block';
        // Force reflow for silky smooth slide transition
        void panel.offsetWidth;
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    });
  }

  btns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-exec-target');
      if (target) activateMember(target);
    });

    btn.addEventListener('keydown', (e) => {
      let nextIdx = -1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextIdx = (idx + 1) % btns.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        nextIdx = (idx - 1 + btns.length) % btns.length;
      } else if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = btns.length - 1;
      }

      if (nextIdx !== -1) {
        e.preventDefault();
        btns[nextIdx].focus();
        const target = btns[nextIdx].getAttribute('data-exec-target');
        if (target) activateMember(target);
      }
    });
  });
}
