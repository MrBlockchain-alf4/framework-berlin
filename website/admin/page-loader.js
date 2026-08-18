(async function () {
  try {
    const res = await fetch('/admin/api/data');
    if (!res.ok) return;
    const D = await res.json();

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

    /* ── booking URL on all Book Now links ───────────────────── */
    if (D.site && D.site.booking_url) {
      document.querySelectorAll('a.nav-cta, a.mob-cta, a.loc-btn, a.hero-cta[href*="classpass"]').forEach(a => {
        if (a.href.includes('classpass') || a.href.includes('booking')) a.href = D.site.booking_url;
      });
    }

    /* ── HOME: pricing grid ──────────────────────────────────── */
    const pricingRoot = document.getElementById('fw-pricing-root');
    if (pricingRoot && D.home && D.home.pricing) {
      pricingRoot.innerHTML = D.home.pricing.map((p, i) => `
        <div class="price-card ao d${i + 1}${p.popular ? ' popular' : ''}">
          ${p.popular ? '<div class="popular-badge">Most Popular</div>' : ''}
          <div class="price-credits">${p.credits}</div>
          <div class="price-tier">${p.name}</div>
          <div class="price-amount">${p.amount}</div>
          <div class="price-unit">total</div>
          <div class="price-note">${p.note}</div>
          <div class="price-divider"></div>
          <ul class="price-features">
            <li>Valid 6 months</li>
            <li>Both studio locations</li>
          </ul>
          <a href="${(D.site && D.site.booking_url) || '#'}" class="price-btn" target="_blank" rel="noopener">Book Now</a>
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
        <div class="loc-card ao d${i + 1}">
          <div class="loc-img-wrap">
            <div class="loc-img-placeholder">
              <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="40" cy="30" r="16"/><path d="M10 72 C10 50 70 50 70 72"/></svg>
              <span>Insert Photo</span>
            </div>
            <div class="loc-img-overlay">
              <p class="loc-neighborhood">${loc.neighborhood}</p>
              <h3 class="loc-name">${loc.name}</h3>
            </div>
          </div>
          <div class="loc-body">
            <p class="loc-address">${loc.address}</p>
            <p class="loc-hours">${loc.hours}</p>
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
        <div class="slide">
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
      srvRoot.innerHTML = D.physio.services.map(s => `
        <div class="srv-card">
          <div class="srv-icon"><svg viewBox="0 0 24 24">${icons[s.icon] || icons.bolt}</svg></div>
          <div class="srv-title">${s.title}</div>
          <p class="srv-text">${s.text}</p>
        </div>`).join('');
    }

    /* ── PHYSIO: specialists ─────────────────────────────────── */
    const specRoot = document.getElementById('fw-physio-specialists-root');
    if (specRoot && D.physio && D.physio.specialists) {
      specRoot.innerHTML = D.physio.specialists.map(sp => `
        <div class="physio-card">
          <div class="physio-img-wrap">
            <div class="physio-img-placeholder">
              <svg viewBox="0 0 80 80" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="16"/><path d="M10 72 C10 50 70 50 70 72"/></svg>
              <span>Insert Photo</span>
            </div>
            <div class="physio-img-tint"></div>
          </div>
          <div class="physio-body">
            <div class="physio-name">${sp.name}</div>
            <div class="physio-title">${sp.title}</div>
            ${sp.bio.map(b => `<p class="physio-bio">${b}</p>`).join('')}
            <div class="physio-tags">
              ${sp.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
          </div>
        </div>`).join('');
      /* scroll-in animation */
      const pio = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('pc-visible'); pio.unobserve(e.target); } });
      }, { threshold: 0.1 });
      specRoot.querySelectorAll('.physio-card').forEach(c => pio.observe(c));
    }

  } catch (_) { /* silent — page renders fine with hardcoded content */ }
})();
