// Vercel native serverless function (lives at website/api/render.js, next to
// website/api/admin/data.js — this project's Vercel dashboard "Root
// Directory" is set to website/, so /api here is what /api means at the
// deployed root). Serves `/` — see the rewrite in website/vercel.json.
// Reads the static template from ../../templates/index.html (moved out of
// website/ so Vercel's static file serving doesn't shadow this rewrite — a
// static file always wins over a rewrite if both exist at the same path)
// and bakes the current photo fields (logo, hero, about) into it from
// Supabase before responding, so the very first byte a visitor receives
// already has the correct photo — no flash of an old baked-in image while
// client-side JS catches up. Same fix as Elit Juwelier's admin bridge.
//
// Deliberately scoped to these three simple attribute-patch photo fields on
// this page only. Team/locations/specialists/pricing are rebuilt from JS
// template strings at runtime (admin/page-loader.js) and never drew this
// complaint — replicating that templating here would multiply the risk of
// this function for no real benefit. team.html and physiotherapy.html only
// have the logo in this same scope, which rarely changes and is already
// covered by the localStorage-cache fix for any returning visitor — left on
// the existing client-side path rather than adding two more of these
// functions for a field that's never actually been reported as an issue.
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLIENT_ID = 'framework-berlin';
const TABLE = 'website_data';

const TEMPLATE_PATH = path.join(__dirname, '../../templates/index.html');

async function supabaseGet() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}?client_id=eq.${CLIENT_ID}&select=data`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length ? rows[0].data : null;
  } catch (_) {
    return null;
  }
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function focalStyle(pos, kind) {
  if (!pos) return '';
  const x = typeof pos.x === 'number' ? pos.x : 50;
  const y = typeof pos.y === 'number' ? pos.y : 50;
  const scale = typeof pos.scale === 'number' ? pos.scale : 100;
  return kind === 'bg'
    ? `background-position:${x}% ${y}%;background-size:${scale}%;`
    : `object-position:${x}% ${y}%;${scale !== 100 ? `transform:scale(${scale / 100});` : ''}`;
}

function mergeStyle(tag, addition) {
  if (/\sstyle="/.test(tag)) {
    return tag.replace(/\sstyle="([^"]*)"/, (_m, existing) => ` style="${existing}${addition}"`);
  }
  return tag.replace(/\/?>$/, ` style="${addition}"$&`);
}

// Plain <img data-fw="KEY" ... src="..."> — used for the logo (appears
// twice: nav and footer). Mirrors patchImage()'s src-replace in
// page-loader.js. Matches the whole tag first rather than assuming src comes
// after data-fw — Framework's logo tags have src BEFORE data-fw (the
// opposite order from Elit's), so a "data-fw then src" regex silently
// matches nothing here.
function patchImgSrc(html, key, src, pos) {
  if (src == null) return html;
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tagRe = new RegExp(`<img\\b[^>]*\\bdata-fw="${k}"[^>]*>`, 'g');
  return html.replace(tagRe, (tag) => {
    let out = /\ssrc="[^"]*"/.test(tag)
      ? tag.replace(/\ssrc="[^"]*"/, ` src="${escapeAttr(src)}"`)
      : tag.replace(/\/?>$/, ` src="${escapeAttr(src)}"$&`);
    const style = focalStyle(pos, 'img');
    if (style) out = mergeStyle(out, style);
    return out;
  });
}

// <div data-fw="KEY" data-fw-bg> — hero/about, which have no baked-in photo
// in the static HTML at all (just a placeholder), so this bakes in a
// background-image style and hides the sibling "Insert Photo" placeholder,
// mirroring what applyData()'s background-image + placeholder-toggle logic
// does client-side.
function patchBg(html, key, src, pos, placeholderClass) {
  if (src == null) return html;
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const style = `background-image:url('${escapeAttr(src)}');${focalStyle(pos, 'bg')}`;
  const tagRe = new RegExp(`<div\\b[^>]*\\bdata-fw="${k}"[^>]*\\bdata-fw-bg\\b[^>]*>`, 'g');
  let out = html.replace(tagRe, (tag) => mergeStyle(tag, style));
  if (placeholderClass) {
    const phRe = new RegExp(`<div class="${placeholderClass}">`);
    out = out.replace(phRe, `<div class="${placeholderClass}" style="display:none">`);
  }
  return out;
}

module.exports = async (req, res) => {
  let html;
  try {
    html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  } catch (err) {
    res.status(500).send('Template read failed: ' + String(err));
    return;
  }

  // Any failure here (a malformed Supabase row, an unexpected shape) falls
  // back to serving the template unpatched rather than a 500 — the site
  // stays up showing whatever's baked in, exactly the pre-existing
  // behavior, instead of going down over a photo-patching bug.
  try {
    const data = await supabaseGet();
    if (data) {
      html = patchImgSrc(html, 'site.logo', data.site && data.site.logo);
      if (data.home) {
        html = patchBg(html, 'home.hero.image', data.home.hero && data.home.hero.image, data.home.hero && data.home.hero.image_position, 'hero-placeholder');
        html = patchBg(html, 'home.about.image', data.home.about && data.home.about.image, data.home.about && data.home.about.image_position, 'about-img-placeholder');
      }
    }
  } catch (_) {
    /* fall through and serve the unpatched template below */
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
