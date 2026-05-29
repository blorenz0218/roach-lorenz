'use strict';

/**
 * Lifecycle test for the publish orchestrator against the local-fs store.
 * Proves: first publish -> base slug; republish -> new slug + old becomes a
 * redirect stub (no numbers); previews don't supersede the borrower chain and
 * never expire; the daily job applies the stale banner past the window.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { JSDOM } = require('jsdom');
const { createLocalStore } = require('../lib/storage-local');
const { publishSizing, markStaleSizings } = require('../lib/publish');

const arc = fs.readFileSync(path.join(__dirname, 'arc-paste.txt'), 'utf8');
const sonoran = fs.readFileSync(path.join(__dirname, 'sonoran-paste.txt'), 'utf8');
const BASE = 'https://sizings.centennialmortgage.com';

let failures = 0;
function check(label, got, want) {
  const ok = String(got) === String(want);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(40)} got=${JSON.stringify(got)}${ok ? '' : '  want=' + JSON.stringify(want)}`);
}
const pageText = (html) => new JSDOM(html).window.document.body.textContent;
const hasNumber = (html) => /\$[\d,]{4,}/.test(html); // any $36,019,600-style figure

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sizing-store-'));
const store = createLocalStore(root);

(async () => {

console.log('--- FIRST PUBLISH (Arc) ---');
const t0 = '2026-05-01T12:00:00.000Z';
const p1 = await publishSizing(arc, { baseUrl: BASE, now: t0 }, store);
check('slug is bare base', p1.slug, 'arc-apartment-homes-great-falls-mt');
check('url', p1.url, BASE + '/arc-apartment-homes-great-falls-mt');
check('record status current', await store.getRecord(p1.slug).status, 'current');
check('nothing superseded yet', p1.superseded.length, 0);
check('page served', !!await store.getPage(p1.slug), true);
check('email points at this url', p1.email.includes(p1.url), true);
check('staleAt = +30d', await store.getRecord(p1.slug).staleAt, '2026-05-31T12:00:00.000Z');

console.log('\n--- INTERNAL PREVIEW (does not supersede) ---');
const pv = await publishSizing(arc, { baseUrl: BASE, now: '2026-05-02T12:00:00.000Z', preview: true }, store);
check('preview slug suffixed', pv.slug, 'arc-apartment-homes-great-falls-mt-preview');
check('preview did not supersede', pv.superseded.length, 0);
check('original still current', await store.getRecord(p1.slug).status, 'current');
check('preview has no staleAt', await store.getRecord(pv.slug).staleAt, null);
check('preview page watermarked', pv.page.includes('preview-mode'), true);

console.log('\n--- REPUBLISH SAME PROPERTY (supersession) ---');
const t1 = '2026-05-10T12:00:00.000Z';
const p2 = await publishSizing(arc, { baseUrl: BASE, now: t1 }, store);
check('new slug minted', p2.slug, 'arc-apartment-homes-great-falls-mt-2');
check('superseded the original', p2.superseded.includes(p1.slug), true);
check('did NOT supersede preview', p2.superseded.includes(pv.slug), false);
check('old record now superseded', await store.getRecord(p1.slug).status, 'superseded');
check('old record points to new', await store.getRecord(p1.slug).supersededBy, p2.slug);
const oldPage = await store.getPage(p1.slug);
check('old page is the expired stub', /expired/i.test(pageText(oldPage)), true);
check('old page redirects to new url', oldPage.includes(p2.url), true);
check('old stub shows NO numbers (anti-anchor)', hasNumber(oldPage), false);
check('new page is the live sizing', await store.getRecord(p2.slug).status, 'current');

console.log('\n--- DIFFERENT PROPERTY DOES NOT COLLIDE ---');
const ps = await publishSizing(sonoran, { baseUrl: BASE, now: t1 }, store);
check('sonoran own slug', ps.slug, 'sonoran-vista-apartments-phoenix-az');
check('arc still current', await store.getRecord(p2.slug).status, 'current');

console.log('\n--- SOFT EXPIRY (daily job) ---');
// 20 days after republish: still fresh (staleAt was t1 + 30d).
const earlyMarked = await markStaleSizings(store, { now: '2026-05-30T12:00:00.000Z' });
check('not stale before window', earlyMarked.includes(p2.slug), false);
// 31 days after republish: past window.
const lateMarked = await markStaleSizings(store, { now: '2026-06-11T12:00:00.000Z' });
check('marked stale after window', lateMarked.includes(p2.slug), true);
check('record flagged stale', await store.getRecord(p2.slug).stale, true);
check('stale banner now in page', await store.getPage(p2.slug).includes('staleBanner'), true);
check('superseded stub never marked stale', lateMarked.includes(p1.slug), false);
check('preview never marked stale', lateMarked.includes(pv.slug), false);
// idempotent: a second run marks nothing new.
const reMarked = await markStaleSizings(store, { now: '2026-06-12T12:00:00.000Z' });
check('expiry job idempotent', reMarked.includes(p2.slug), false);

fs.rmSync(root, { recursive: true, force: true });
  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
})();
