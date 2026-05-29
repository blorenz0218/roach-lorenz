'use strict';

/**
 * End-to-end verifier for storage-github.js (handoff step 5).
 *
 * Brian/Wim: set env vars, point at a SCRATCH repo (not the production one),
 * and run. The script does:
 *
 *   1. publish "Arc Apartment Homes / Great Falls / MT"
 *      → confirm s/<slug>/index.html committed, data/<slug>.json committed
 *   2. republish same property
 *      → confirm a new slug is minted, original page is replaced with a stub
 *   3. run the expire job with now = +31 days
 *      → confirm the current (non-superseded) record's page now has the
 *        gray stale banner
 *   4. clean up — delete every record + page it created
 *
 * If any step fails, the cleanup still runs. Re-run idempotently.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx \
 *   GITHUB_OWNER=blorenz0218 \
 *   GITHUB_REPO=sizings-scratch \
 *   GITHUB_BRANCH=main \
 *   node sizings/test/verify-github-storage.js
 */

const fs = require('fs');
const path = require('path');

const { publishSizing, markStaleSizings } = require('../lib/publish');
const { createGitHubStore } = require('../lib/storage-github');

const PASTE = fs.readFileSync(path.join(__dirname, 'arc-paste.txt'), 'utf8');
const CHASSIS = fs.readFileSync(path.join(__dirname, '..', 'lib', 'chassis-template.html'), 'utf8');
const BASE_URL = 'https://sizings.roachlorenz.com';

function need(name) {
  const v = process.env[name];
  if (!v) { console.error(`Missing env var: ${name}`); process.exit(2); }
  return v;
}

function pass(msg) { console.log(`PASS  ${msg}`); }
function fail(msg, got) { console.log(`FAIL  ${msg}  got=${JSON.stringify(got)}`); process.exitCode = 1; }

async function main() {
  const token = need('GITHUB_TOKEN');
  const owner = need('GITHUB_OWNER');
  const repo = need('GITHUB_REPO');
  const branch = process.env.GITHUB_BRANCH || 'main';

  // Use ad-hoc dataDir/pagesDir so we don't collide with any existing test runs
  // or with real production data if someone points at the wrong repo.
  const stamp = Date.now().toString(36);
  const dataDir = `__verify-data-${stamp}`;
  const pagesDir = `__verify-pages-${stamp}`;

  const store = createGitHubStore({
    owner, repo, branch, token,
    dataDir, pagesDir,
    committer: { name: 'sizing-verify', email: 'sizings@centennialmortgage.com' }
  });

  console.log(`Using scratch dirs ${dataDir}/ and ${pagesDir}/ in ${owner}/${repo}@${branch}`);

  const createdSlugs = [];

  try {
    // ---- 1. First publish ----
    console.log('\n--- 1. FIRST PUBLISH ---');
    const r1 = await publishSizing(PASTE, { baseUrl: BASE_URL, template: CHASSIS }, store);
    createdSlugs.push(r1.slug);
    r1.slug === 'arc-apartment-homes-great-falls-mt'
      ? pass(`slug minted: ${r1.slug}`) : fail('slug expected arc-apartment-homes-great-falls-mt', r1.slug);

    const page1 = await store.getPage(r1.slug);
    page1 && page1.length > 1000 ? pass('first page committed') : fail('first page missing', page1 && page1.length);

    const rec1 = await store.getRecord(r1.slug);
    rec1 && rec1.status === 'current' ? pass('record current') : fail('record not current', rec1 && rec1.status);

    // ---- 2. Republish (supersession) ----
    console.log('\n--- 2. REPUBLISH ---');
    const r2 = await publishSizing(PASTE, { baseUrl: BASE_URL, template: CHASSIS }, store);
    createdSlugs.push(r2.slug);
    r2.slug.endsWith('-2') ? pass(`new slug suffixed: ${r2.slug}`) : fail('new slug not -2', r2.slug);
    r2.superseded.includes(r1.slug) ? pass('superseded original slug') : fail('superseded list missing original', r2.superseded);

    const oldPage = await store.getPage(r1.slug);
    /redirect|expired/i.test(oldPage) ? pass('original page is now a stub') : fail('original page not a stub', oldPage && oldPage.slice(0, 200));
    oldPage && oldPage.includes(r2.url) ? pass('stub points at new url') : fail('stub does not link new url', null);

    const oldRec = await store.getRecord(r1.slug);
    oldRec.status === 'superseded' ? pass('old record marked superseded') : fail('old record not superseded', oldRec.status);
    oldRec.supersededBy === r2.slug ? pass('old record points at new slug') : fail('supersededBy wrong', oldRec.supersededBy);

    // ---- 3. Expire job (simulated +31d) ----
    console.log('\n--- 3. EXPIRE JOB ---');
    const future = new Date(Date.now() + 31 * 86400000);
    const marked = await markStaleSizings(store, { now: future, template: CHASSIS });
    marked.includes(r2.slug) ? pass(`marked current sizing stale: ${r2.slug}`) : fail('current sizing not marked stale', marked);
    !marked.includes(r1.slug) ? pass('superseded stub left alone') : fail('superseded stub was marked stale', marked);

    const stalePage = await store.getPage(r2.slug);
    /likely|moved|stale|expired/i.test(stalePage) ? pass('stale banner present in page') : fail('no stale banner in page', stalePage && stalePage.slice(0, 200));

    const staleRec = await store.getRecord(r2.slug);
    staleRec.stale === true ? pass('record flagged stale') : fail('record not flagged stale', staleRec.stale);

  } finally {
    // ---- 4. Cleanup — delete everything we wrote ----
    console.log('\n--- 4. CLEANUP ---');
    for (const slug of createdSlugs) {
      try { await deleteFile(`${pagesDir}/${slug}/index.html`); } catch (e) { console.warn('cleanup page', slug, e.message); }
      try { await deleteFile(`${dataDir}/${slug}.json`); } catch (e) { console.warn('cleanup record', slug, e.message); }
    }
    console.log(`cleaned ${createdSlugs.length * 2} file(s)`);
  }

  // Tiny Contents API delete (storage-github exposes only PUT/GET; cleanup is
  // out-of-band, so we keep it here in the test scaffold).
  async function deleteFile(repoPath) {
    const base = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'centennial-sizing-pipeline-verify'
    };
    const res = await fetch(`${base}/${encodeURI(repoPath)}?ref=${encodeURIComponent(branch)}`, { headers });
    if (res.status === 404) return;
    if (!res.ok) throw new Error(`GET ${repoPath} -> ${res.status}`);
    const meta = await res.json();
    const del = await fetch(`${base}/${encodeURI(repoPath)}`, {
      method: 'DELETE', headers,
      body: JSON.stringify({ message: `cleanup ${repoPath}`, sha: meta.sha, branch })
    });
    if (!del.ok) throw new Error(`DELETE ${repoPath} -> ${del.status}`);
  }

  if (process.exitCode) console.log('\nFAILED'); else console.log('\nALL CHECKS PASSED');
}

main().catch((e) => { console.error(e); process.exit(1); });
