(function () {
  /* ── shared patch logic — used for both the initial GET and any live
     postMessage update from the kundenzugang admin panel ─────────────── */
  function applyData(D) {
    if (!D) return;

    /* ── accent color ────────────────────────────────────────── */
    if (D.site && D.site.accent) {
      document.documentElement.style.setProperty('--green', D.site.accent);
      document.documentElement.style.setProperty('--green-hover', D.site.accent);
    }

    /* ── patch data-fw elements (dotted path support) ────────── */
    function resolvePath(obj, path) {
      return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
    }
    document.querySelectorAll('[data-fw]').forEach(el => {
      const key = el.getAttribute('data-fw');
      const val = resolvePath(D, key);
      if (val == null) return;
      if (el.tagName === 'IMG') {
        el.src = val;
      } else if (el.hasAttribute('data-fw-bg')) {
        el.style.backgroundImage = `url('${val}')`;
      } else {
        el.innerHTML = String(val).replace(/\n/g, '<br>');
      }
    });

    /* ── stat count-up sync ───────────────────────────────────
       .stat-num elements have a separate count-up animation that reads
       data-count/data-suffix on scroll-into-view (see the IntersectionObserver
       below) and overwrites textContent from those attributes, not from
       what was just set above — without this, an admin-edited stat value
       would get silently reverted back to the old number the moment the
       visitor scrolls to it. Re-derive both attributes from the new text. */
    document.querySelectorAll('.stat-num[data-fw]').forEach(el => {
      const m = el.textContent.match(/^(\d+)(.*)$/);
      if (m) { el.setAttribute('data-count', m[1]); el.setAttribute('data-suffix', m[2]); }
    });

    /* ── hero image focal point + zoom (admin-set, optional) ─── */
    const heroBg = document.getElementById('hero-bg');
    if (heroBg && D.home && D.home.hero && D.home.hero.image_position) {
      const pos = D.home.hero.image_position;
      const x = typeof pos.x === 'number' ? pos.x : 50;
      const y = typeof pos.y === 'number' ? pos.y : 50;
      const scale = typeof pos.scale === 'number' ? pos.scale : 100;
      heroBg.style.backgroundPosition = `${x}% ${y}%`;
      heroBg.style.backgroundSize = `${scale}%`;
    }

    /* ── hero/about "Insert Photo" placeholder toggle ─────────── */
    // hero-bg and about-img-wrap both get their background-image set
    // correctly by the generic [data-fw] loop above, but each has a static
    // "Insert Photo" child that was never actually hidden once a real
    // image exists — for About (opaque background) that fully hid the
    // photo underneath, exactly the dead-placeholder bug already fixed for
    // locations/team/physio.
    if (heroBg) {
      const heroPlaceholder = heroBg.querySelector('.hero-placeholder');
      if (heroPlaceholder) heroPlaceholder.style.display = D.home?.hero?.image ? 'none' : '';
    }
    const aboutImgWrap = document.querySelector('.about-img-wrap');
    if (aboutImgWrap) {
      const aboutPlaceholder = aboutImgWrap.querySelector('.about-img-placeholder');
      if (aboutPlaceholder) aboutPlaceholder.style.display = D.home?.about?.image ? 'none' : '';
    }

    /* ── booking URL on all Book Now links ───────────────────── */
    if (D.site && D.site.booking_url) {
      document.querySelectorAll('a.nav-cta, a.mob-cta, a.loc-btn, a.hero-cta[href*="classpass"]').forEach(a => {
        if (a.href.includes('classpass') || a.href.includes('booking')) a.href = D.site.booking_url;
      });
    }

    /* ── HOME: class card image toggle (Our Classes) ──────────── */
    // The <img data-fw="home.services.N.image"> tags already get their src
    // set by the generic [data-fw] loop above; this just swaps visibility
    // with the static placeholder once a photo actually exists.
    if (D.home && Array.isArray(D.home.services)) {
      D.home.services.forEach((s, i) => {
        const img = document.getElementById('class-img-' + i);
        if (!img) return;
        const wrap = img.closest('.class-img-wrap');
        const placeholder = wrap ? wrap.querySelector('.class-img-placeholder') : null;
        img.style.display = s.image ? 'block' : 'none';
        if (placeholder) placeholder.style.display = s.image ? 'none' : '';
      });
    }

    /* ── HOME: pricing grid ──────────────────────────────────── */
    const pricingRoot = document.getElementById('fw-pricing-root');
    if (pricingRoot && D.home && D.home.pricing) {
      pricingRoot.innerHTML = D.home.pricing.map((p, i) => `
        <div class="price-card ao d${i + 1}${p.popular ? ' popular' : ''}" data-fw-section="pricing">
          ${p.popular ? '<div class="popular-badge">Most Popular</div>' : ''}
          <div class="price-credits" data-fw="home.pricing.${i}.credits">${p.credits}</div>
          <div class="price-tier" data-fw="home.pricing.${i}.name">${p.name}</div>
          <div class="price-amount" data-fw="home.pricing.${i}.amount">${p.amount}</div>
          <div class="price-unit">total</div>
          <div class="price-note" data-fw="home.pricing.${i}.note">${p.note}</div>
          <div class="price-divider"></div>
          <ul class="price-features">
            <li>Valid 6 months</li>
            <li>Both studio locations</li>
          </ul>
          <a href="${(D.site && D.site.booking_url) || '#'}" class="price-btn" target="_blank" rel="noopener" data-fw="home.pricing_section.btn_text">${(D.home.pricing_section && D.home.pricing_section.btn_text) || 'Book Now'}</a>
        </div>`).join('');
      /* re-observe new elements for scroll animation */
      if (window._fw_io) {
        pricingRoot.querySelectorAll('.ao').forEach(el => window._fw_io.observe(el));
      }
    }

    /* ── HOME: locations grid ────────────────────────────────── */
    const locRoot = document.getElementById('fw-locations-root');
    if (locRoot && D.home && D.home.locations) {
      locRoot.innerHTML = D.home.locations.map((loc, i) => `
        <div class="loc-card ao d${i + 1}" data-fw-section="contact">
          <div class="loc-img-wrap">
            ${loc.image
              ? `<img class="loc-img" data-fw="home.locations.${i}.image" src="${loc.image}" style="object-position:${loc.img_position || 'center'}" alt="${loc.name}">`
              : `<div class="loc-img-placeholder" data-fw-click="home.locations.${i}.image">
                  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="40" cy="30" r="16"/><path d="M10 72 C10 50 70 50 70 72"/></svg>
                  <span>Insert Photo</span>
                </div>`}
            <div class="loc-img-overlay">
              <p class="loc-neighborhood" data-fw="home.locations.${i}.neighborhood">${loc.neighborhood}</p>
              <h3 class="loc-name" data-fw="home.locations.${i}.name">${loc.name}</h3>
            </div>
          </div>
          <div class="loc-body">
            <p class="loc-address" data-fw="home.locations.${i}.address">${loc.address}</p>
            <p class="loc-hours" data-fw="home.locations.${i}.hours">${loc.hours}</p>
            <a href="${(D.site && D.site.booking_url) || '#'}" class="loc-btn" target="_blank" rel="noopener">Book on ClassPass →</a>
          </div>
        </div>`).join('');
      if (window._fw_io) {
        locRoot.querySelectorAll('.ao').forEach(el => window._fw_io.observe(el));
      }
    }

    /* ── HOME: testimonials carousel ─────────────────────────── */
    const carTrack = document.getElementById('car-track');
    const carDots  = document.querySelector('.car-dots');
    if (carTrack && carDots && D.home && D.home.testimonials) {
      const quotes = `<svg viewBox="0 0 40 32" fill="currentColor"><path d="M0 32V20.5C0 9.167 4.333 2.167 13 0l2 3.5C10.333 5.167 8.167 8.333 7.5 13H14V32H0Zm22 0V20.5C22 9.167 26.333 2.167 35 0l2 3.5C32.333 5.167 30.167 8.333 29.5 13H36V32H22Z"/></svg>`;
      carTrack.innerHTML = D.home.testimonials.map(t => `
        <div class="slide" data-fw-section="testimonials">
          <div class="slide-inner">
            <div class="t-quote-mark">${quotes}</div>
            <div class="t-stars">★★★★★</div>
            <p class="t-quote">"${t.quote}"</p>
            <div class="t-divider"></div>
            <div class="t-source">
              <div class="t-name">${t.name}</div>
              <div class="t-badge">${t.badge}</div>
            </div>
          </div>
        </div>`).join('');
      carDots.innerHTML = D.home.testimonials.map((_, i) =>
        `<button class="car-dot${i === 0 ? ' on' : ''}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join('');
      /* re-init carousel */
      if (window._fw_initCarousel) window._fw_initCarousel();
    }

    /* ── TEAM: grid ──────────────────────────────────────────── */
    const teamGrid = document.getElementById('team-grid');
    if (teamGrid && D.team && D.team.members) {
      window._FW_TEAM = D.team.members;
      if (window._fw_renderTeam) window._fw_renderTeam(D.team.members);
    }

    /* ── PHYSIO: hero image (static placeholder, no JS rebuild) ─ */
    const physioHeroImg = document.getElementById('physio-hero-img');
    const physioHeroPlaceholder = document.querySelector('.physio-hero-placeholder');
    if (physioHeroImg && D.physio && D.physio.hero) {
      const img = D.physio.hero.image;
      physioHeroImg.style.display = img ? 'block' : 'none';
      if (img) physioHeroImg.src = img;
      if (physioHeroPlaceholder) physioHeroPlaceholder.style.display = img ? 'none' : '';
    }

    /* ── PHYSIO: services ────────────────────────────────────── */
    const srvRoot = document.getElementById('fw-services-root');
    if (srvRoot && D.physio && D.physio.services) {
      const icons = {
        clipboard: `<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/>`,
        hand:      `<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>`,
        arrow:     `<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/><path d="M3 19c0-4 2-7 5-8"/>`,
        rehab:     `<path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M12 2v4"/><path d="M12 18v4"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`,
        prenatal:  `<circle cx="12" cy="5" r="2"/><path d="M12 7c-2.5 0-4 1.5-4 3.5v1h3l1 3h-4v4h8v-4h-4l1-3h3v-1c0-2-1.5-3.5-4-3.5z"/><path d="M9 18c0 1.5.8 3 3 3s3-1.5 3-3"/>`,
        bolt:      `<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`
      };
      srvRoot.innerHTML = D.physio.services.map((s, i) => `
        <div class="srv-card" data-fw-section="physio.services">
          <div class="srv-icon"><svg viewBox="0 0 24 24">${icons[s.icon] || icons.bolt}</svg></div>
          <div class="srv-title" data-fw="physio.services.${i}.title">${s.title}</div>
          <p class="srv-text" data-fw="physio.services.${i}.text">${s.text}</p>
        </div>`).join('');
    }

    /* ── PHYSIO: specialists ─────────────────────────────────── */
    const specRoot = document.getElementById('fw-physio-specialists-root');
    if (specRoot && D.physio && D.physio.specialists) {
      specRoot.innerHTML = D.physio.specialists.map((sp, i) => `
        <div class="physio-card" data-fw-section="physio.specialists">
          <div class="physio-img-wrap">
            ${sp.img
              ? `<img class="physio-img" data-fw="physio.specialists.${i}.img" src="${sp.img}" alt="${sp.name}">`
              : `<div class="physio-img-placeholder" data-fw-click="physio.specialists.${i}.img">
                  <svg viewBox="0 0 80 80" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="16"/><path d="M10 72 C10 50 70 50 70 72"/></svg>
                  <span>Insert Photo</span>
                </div>`}
            <div class="physio-img-tint"></div>
          </div>
          <div class="physio-body">
            <div class="physio-name" data-fw="physio.specialists.${i}.name">${sp.name}</div>
            <div class="physio-title" data-fw="physio.specialists.${i}.title">${sp.title}</div>
            ${sp.bio.map((b, bi) => `<p class="physio-bio" data-fw="physio.specialists.${i}.bio.${bi}">${b}</p>`).join('')}
            <div class="physio-tags">
              ${sp.tags.map((t, ti) => `<span class="tag" data-fw="physio.specialists.${i}.tags.${ti}">${t}</span>`).join('')}
            </div>
          </div>
        </div>`).join('');
      /* scroll-in animation */
      const pio = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('pc-visible'); pio.unobserve(e.target); } });
      }, { threshold: 0.1 });
      specRoot.querySelectorAll('.physio-card').forEach(c => pio.observe(c));
    }
  }

  /* ── initial load: fetch real data and patch ──────────────────────── */
  (async function () {
    try {
      const res = await fetch('/admin/api/data');
      if (!res.ok) return;
      const D = await res.json();
      applyData(D);
    } catch (_) { /* silent — page renders fine with hardcoded content */ }
  })();

  /* ── live preview: patch instantly from postMessage while editing in
     the kundenzugang admin panel — this is a preview-only page, never
     writes anything; Supabase is only ever touched by /admin/api/data
     via the admin's explicit Save action ───────────────────────────── */
  const ADMIN_ORIGINS = [
    'https://www.afa-ai.com',
    'https://afa-ai.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  let highlighted = [];
  function applyHighlight(paths, section) {
    highlighted.forEach(el => el.classList.remove('fw-admin-hl'));
    highlighted = [];
    let targets = [];
    if (paths && paths.length) {
      targets = paths
        .map(p => document.querySelector(`[data-fw="${p}"]`))
        .filter(Boolean);
    } else if (section) {
      targets = Array.from(document.querySelectorAll(`[data-fw-section="${section}"]`));
    }
    targets.forEach(el => el.classList.add('fw-admin-hl'));
    highlighted = targets;
    if (targets[0]) targets[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  window.addEventListener('message', function (event) {
    if (ADMIN_ORIGINS.indexOf(event.origin) === -1) return;
    const msg = event.data;
    if (!msg || !msg.type) return;
    if (msg.type === 'FW_ADMIN_PREVIEW' && msg.data) {
      try { applyData(msg.data); } catch (_) { /* ignore malformed preview payloads */ }
    } else if (msg.type === 'FW_ADMIN_HIGHLIGHT') {
      applyHighlight(msg.paths || null, msg.section || null);
    }
  });

  /* ── click-to-edit — only active when actually embedded in the admin
     panel (never for a normal visitor loading the page directly), and only
     ever posts a field path string back — no data leaves the page, nothing
     is written anywhere from here. ──────────────────────────────────────── */
  if (window.self !== window.top) {
    const hlStyle = document.createElement('style');
    hlStyle.textContent = '.fw-admin-hl{outline:2px solid #00D4FF !important;outline-offset:2px;border-radius:2px;}';
    document.head.appendChild(hlStyle);

    document.addEventListener('click', function (e) {
      // data-fw-click marks elements that should be selectable but must
      // never be content-patched by applyData() (e.g. the hero overlay
      // sitting on top of #hero-bg — it needs to be clickable for the
      // image field, but must never receive the image itself as its
      // background or innerHTML, which is why this is a separate
      // attribute from data-fw rather than reusing it).
      const fwEl = e.target.closest('[data-fw]');
      const fwClickEl = !fwEl ? e.target.closest('[data-fw-click]') : null;
      const sectionEl = e.target.closest('[data-fw-section]');
      const path = fwEl
        ? fwEl.getAttribute('data-fw')
        : fwClickEl
          ? fwClickEl.getAttribute('data-fw-click')
          : null;
      if (!path && !sectionEl) return;
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage(
        {
          type: 'FW_ADMIN_SELECT',
          path: path,
          section: sectionEl ? sectionEl.getAttribute('data-fw-section') : null,
        },
        '*',
      );
    }, true);
  }
})();
