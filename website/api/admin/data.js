// Vercel native serverless function (not a Next.js route — this project has
// no working app/pages directory, so `next build` fails; files under /api
// are picked up by Vercel as functions regardless of framework preset).
//
// Exposed at /admin/api/data via the rewrite in vercel.json, matching the
// path admin/page-loader.js and admin/index.html already fetch — this
// endpoint didn't exist before, so both were silently failing (caught by
// their own try/catch) and every page was rendering its hardcoded fallback
// content instead of admin/data.json.
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'admin', 'data.json');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(raw);
    } catch (err) {
      res.status(500).json({ error: 'Could not read admin/data.json', detail: String(err) });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      fs.writeFileSync(DATA_PATH, JSON.stringify(req.body, null, 2), 'utf-8');
      res.status(200).json({ ok: true });
    } catch (err) {
      // Vercel serverless functions have a read-only filesystem in
      // production — writes here only ever work in local `next dev`/`vercel dev`.
      // Real persistence needs a database, not a JSON file on disk.
      res.status(500).json({
        ok: false,
        error:
          'Write failed — Vercel serverless functions cannot write to the deployment filesystem in production. This endpoint needs a real datastore (e.g. a database) to persist changes; a JSON file on disk only works in local development.',
        detail: String(err),
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
