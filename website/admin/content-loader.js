/**
 * content-loader.js
 * Included on every public site page. Fetches content.json and patches
 * elements that carry data-fw="key" attributes with their stored values.
 * Falls back silently if the file isn't found (first-load / offline).
 */
(async function () {
  try {
    const res = await fetch('/admin/api/content');
    if (!res.ok) return;
    const data = await res.json();

    document.querySelectorAll('[data-fw]').forEach(el => {
      const key = el.getAttribute('data-fw');
      if (!(key in data)) return;
      const val = data[key];

      if (el.tagName === 'IMG') {
        el.src = val;
      } else if (el.hasAttribute('data-fw-bg')) {
        el.style.backgroundImage = `url('${val}')`;
      } else {
        el.innerHTML = String(val).replace(/\n/g, '<br>');
      }
    });

    // Accent color → CSS custom property
    if (data.accent_color) {
      const r = document.documentElement;
      r.style.setProperty('--green',       data.accent_color);
      r.style.setProperty('--green-hover', data.accent_color);
    }
  } catch (_) {
    /* silent — page renders fine with its own hardcoded content */
  }
})();
