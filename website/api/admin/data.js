// Vercel native serverless function (not a Next.js route — this project has
// no working app/pages directory, so `next build` fails; files under /api
// are picked up by Vercel as functions regardless of framework preset).
//
// Exposed at /admin/api/data via the rewrite in vercel.json, matching the
// path admin/page-loader.js and admin/index.html already fetch.
//
// Persistence: Supabase (via its REST API — no @supabase/supabase-js
// dependency needed, just fetch, so this stays dependency-free) when
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set as Vercel env vars.
// Falls back to the bundled admin/data.json (read-only) when they aren't,
// so this doesn't hard-break before Supabase is configured.
const fs = require('fs');
const path = require('path');

const bundledData = require('../../admin/data.json');
const DATA_PATH = path.join(__dirname, '../../admin/data.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLIENT_ID = 'framework-berlin';
const TABLE = 'website_data';

const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

async function supabaseGet() {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?client_id=eq.${CLIENT_ID}&select=data`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase GET failed (HTTP ${res.status})`);
  const rows = await res.json();
  if (!rows.length) return null;
  return rows[0].data;
}

async function supabaseUpsert(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ client_id: CLIENT_ID, data, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Supabase upsert failed (HTTP ${res.status}): ${detail}`);
  }
}

module.exports = async (req, res) => {
  // The AFA kundenzugang admin (afa-ai.com) calls this endpoint cross-origin,
  // so it needs explicit CORS — without this the browser blocks the request
  // before it even reaches this function.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    if (supabaseConfigured) {
      try {
        const data = await supabaseGet();
        if (data) {
          res.status(200).json(data);
          return;
        }
        // No row yet — first run. Fall through to the bundled seed data below.
      } catch (err) {
        res.status(200).json({ ...bundledData, _supabaseError: String(err) });
        return;
      }
    }
    try {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(raw);
    } catch {
      res.status(200).json(bundledData);
    }
    return;
  }

  if (req.method === 'POST') {
    if (supabaseConfigured) {
      try {
        await supabaseUpsert(req.body);
        res.status(200).json({ ok: true });
      } catch (err) {
        res.status(500).json({ ok: false, error: 'Supabase write failed', detail: String(err) });
      }
      return;
    }
    try {
      fs.writeFileSync(DATA_PATH, JSON.stringify(req.body, null, 2), 'utf-8');
      res.status(200).json({ ok: true });
    } catch (err) {
      // Vercel serverless functions have a read-only filesystem in
      // production — writes here only work in local `next dev`/`vercel dev`
      // until SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are set.
      res.status(500).json({
        ok: false,
        error:
          'Write failed — no SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY configured, and Vercel serverless functions cannot write to the deployment filesystem in production.',
        detail: String(err),
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
