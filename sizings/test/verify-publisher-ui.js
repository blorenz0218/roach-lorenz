'use strict';
/** Smoke test for web/publisher.html client logic (fetch stubbed). */
const fs = require('fs'), os = require('os'), path = require('path');
const { JSDOM } = require('jsdom');
const { createLocalStore } = require('../lib/storage-local');
const { publishSizing } = require('../lib/publish');

(async () => {
  const arc = fs.readFileSync(path.join(__dirname, 'arc-paste.txt'), 'utf8');
  const store = createLocalStore(fs.mkdtempSync(path.join(os.tmpdir(), 's-')));
  const pub = await publishSizing(arc, { baseUrl: 'https://sizings.roachlorenz.com', now: '2026-05-10T12:00:00Z' }, store);
  const payload = { slug: pub.slug, url: pub.url, email: pub.email, emailSubject: pub.emailSubject };
  const html = fs.readFileSync(path.join(__dirname, '..', 'web', 'publisher.html'), 'utf8');

  let fail = 0;
  const ck = (l, g, w) => { const ok = String(g) === String(w); if (!ok) fail++; console.log((ok ? 'PASS' : 'FAIL') + '  ' + l.padEnd(36) + ' got=' + JSON.stringify(g) + (ok ? '' : '  want=' + JSON.stringify(w))); };

  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://sizings.roachlorenz.com/' });
  const w = dom.window, d = w.document;
  w.Element.prototype.scrollIntoView = function () {};
  let sent = null;
  w.fetch = async (u, o) => { sent = JSON.parse(o.body); return { ok: true, json: async () => payload }; };

  d.getElementById('paste').value = 'x';
  d.getElementById('publishBtn').click();
  await new Promise(r => setTimeout(r, 30));
  ck('posts paste', sent.paste, 'x');
  ck('result shown', d.getElementById('result').classList.contains('show'), true);
  ck('live URL populated', d.getElementById('liveUrl').value, payload.url);
  ck('email preview has button', d.getElementById('emailPreview').innerHTML.includes('View the Sizing'), true);
  ck('email preview has link', d.getElementById('emailPreview').innerHTML.includes(payload.url), true);
  let opened = null;
  w.open = (u) => { opened = u; return null; };
  d.getElementById('openLinkBtn').click();
  ck('open button opens live URL', opened, payload.url);

  d.getElementById('preview').checked = true;
  d.getElementById('publishBtn').click();
  await new Promise(r => setTimeout(r, 30));
  ck('preview flag posted', sent.preview, true);
  ck('preview note shown', d.querySelector('.preview-note') !== null, true);

  w.fetch = async () => ({ ok: false, json: async () => ({ errors: [{ label: 'Cap Rate', msg: 'bad' }] }) });
  d.getElementById('publishBtn').click();
  await new Promise(r => setTimeout(r, 30));
  ck('error styling', d.getElementById('result').classList.contains('error'), true);
  ck('error item shown', d.querySelector('.errbox li').textContent.includes('Cap Rate'), true);

  console.log('\n' + (fail === 0 ? 'ALL CHECKS PASSED' : fail + ' FAILED'));
  process.exit(fail ? 1 : 0);
})();
