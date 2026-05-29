'use strict';

/**
 * Netlify Scheduled Function: expire
 *
 * Runs daily (cron in netlify.toml). Re-renders every current, non-preview
 * sizing past its 30-day stale window with the gray "pricing has likely
 * moved" banner on. Internal cron only — no Identity gate.
 *
 * Idempotent: the publish lib's markStaleSizings only touches records that
 * haven't been flagged stale yet, so multiple runs in a window are safe.
 */

const fs = require('fs');
const path = require('path');

const { markStaleSizings } = require('../../sizings/lib/publish');
const { createGitHubStore } = require('../../sizings/lib/storage-github');

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

exports.handler = async function () {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token || !owner || !repo) {
    console.error('expire: missing GITHUB_* env vars');
    return { statusCode: 500 };
  }

  const store = createGitHubStore({
    owner,
    repo,
    branch,
    token,
    pagesDir: 's',
    dataDir: 'data',
    committer: { name: 'Sizing Expiry Bot', email: 'sizings@centennialmortgage.com' }
  });

  try {
    const marked = await markStaleSizings(store, { template: CHASSIS_TEMPLATE });
    console.log(`expire: marked ${marked.length} sizing(s) stale`, marked);
    return { statusCode: 200, body: JSON.stringify({ marked }) };
  } catch (err) {
    console.error('expire failed:', err && err.stack ? err.stack : err);
    return { statusCode: 500, body: 'expire failed' };
  }
};

// Netlify Scheduled Functions v2 config — daily at 09:00 UTC (02:00 PT / 05:00 ET).
// The actual schedule is also declared in netlify.toml; this export is the v2 idiom.
exports.config = {
  schedule: '@daily'
};
