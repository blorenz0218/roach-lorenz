'use strict';

/**
 * Netlify Function: publish
 *
 * POST /.netlify/functions/publish
 *   Body: { paste: string, preview?: boolean }
 *   Auth: Netlify Identity JWT; allowlisted emails only.
 *   Returns: { slug, url, email, emailSubject, superseded[] }
 *
 * Wires the storage-github adapter (commits to this repo) to the publish
 * orchestrator from sizings/lib/publish.js. The orchestrator is unchanged
 * core logic — we only set the commit paths so they don't collide with the
 * pipeline source folder /sizings/.
 *
 * Path plan in this repo (decided at deploy time, not relitigation):
 *   data/<slug>.json         → record JSON (blocked from public via _redirects)
 *   s/<slug>/index.html      → served sizing page (clean URL via subdomain rewrite)
 *
 * Env vars (set in Netlify dashboard, NOT in code):
 *   GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, SIZINGS_BASE_URL,
 *   ALLOWED_EMAILS (comma-separated; falls back to a hardcoded duo if unset)
 */

const fs = require('fs');
const path = require('path');

const { publishSizing } = require('../../sizings/lib/publish');
const { createGitHubStore } = require('../../sizings/lib/storage-github');

// Pre-load the chassis template at function cold-start so render.js's
// fs.readFileSync(__dirname/chassis-template.html) doesn't fire — __dirname
// inside an esbuild-bundled function points at the bundle output, not at
// sizings/lib/. We pass the template through publishSizing's opts.template.
const CHASSIS_TEMPLATE = loadChassisTemplate();

function loadChassisTemplate() {
  const candidates = [
    path.join(process.cwd(), 'sizings/lib/chassis-template.html'),
    path.join(__dirname, '..', '..', 'sizings', 'lib', 'chassis-template.html'),
    path.join(__dirname, 'chassis-template.html')
  ];
  for (const p of candidates) {
    try { return fs.readFileSync(p, 'utf8'); } catch (_) {}
  }
  throw new Error('chassis-template.html not found; check netlify.toml included_files');
}

// Fallback allowlist. Brian sets ALLOWED_EMAILS in Netlify to override.
const DEFAULT_ALLOWED = ['blorenz@centennialmortgage.com', 'wroach@centennialmortgage.com'];

function getAllowlist() {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw) return DEFAULT_ALLOWED;
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  // Identity gate. Netlify auto-populates context.clientContext.user when a
  // valid Identity JWT is in the Authorization header.
  const user = context.clientContext && context.clientContext.user;
  const email = user && user.email ? String(user.email).toLowerCase() : null;
  const allowed = getAllowlist();
  if (!email || !allowed.includes(email)) {
    return jsonResponse(401, { error: 'Not authorized.' });
  }

  // Parse body.
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }
  const paste = body.paste;
  const preview = !!body.preview;
  if (typeof paste !== 'string' || !paste.trim()) {
    return jsonResponse(400, { error: 'Paste is empty.' });
  }

  // Required env.
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const baseUrl = process.env.SIZINGS_BASE_URL;
  if (!token || !owner || !repo || !baseUrl) {
    return jsonResponse(500, { error: 'Server missing GITHUB_* or SIZINGS_BASE_URL env vars.' });
  }

  const store = createGitHubStore({
    owner,
    repo,
    branch,
    token,
    // The site's path plan: served pages at /s/<slug>/, records at /data/<slug>.json.
    pagesDir: 's',
    dataDir: 'data',
    committer: {
      name: user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : email,
      email
    }
  });

  try {
    const result = await publishSizing(
      paste,
      { baseUrl, preview, template: CHASSIS_TEMPLATE },
      store
    );
    return jsonResponse(200, {
      slug: result.slug,
      url: result.url,
      email: result.email,
      emailSubject: result.emailSubject,
      superseded: result.superseded
    });
  } catch (err) {
    // parseExportTab validation failure carries .errors with {label, msg, severity}.
    if (err && err.errors) {
      return jsonResponse(422, { error: err.message, errors: err.errors });
    }
    // Logged server-side; the client gets a short message (no GitHub token leaks).
    console.error('publish failed:', err && err.stack ? err.stack : err);
    return jsonResponse(500, { error: 'Publish failed. Check server logs.' });
  }
};
