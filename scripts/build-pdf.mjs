// Build a downloadable PDF of one resource paper.
//
//   node scripts/build-pdf.mjs <slug>
//   e.g. node scripts/build-pdf.mjs hud-build-to-rent-financing
//
// Serves the repo root on a throwaway localhost port, renders
// /resources/<slug>/ with print media at US Letter, and writes
// assets/pdf/<slug>.pdf with the contact footer on every page.
// The page's own @media print block decides what is shown; this script only
// handles the footer, margins, analytics blocking and link rewriting.
//
// Local tool only. Playwright is a dev dependency of scripts/package.json,
// outside the repo root, so the Netlify build never installs it. Re-run this
// after any content edit to a paper that has a PDF (see CLAUDE.md).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://roachlorenz.com';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: node scripts/build-pdf.mjs <slug>');
  process.exit(1);
}
const pagePath = path.join(ROOT, 'resources', slug, 'index.html');
if (!fs.existsSync(pagePath)) {
  console.error('No such paper: resources/' + slug + '/index.html');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.pdf': 'application/pdf', '.json': 'application/json',
};

// Minimal static server for the repo root: /dir/ serves /dir/index.html.
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const local = 'http://127.0.0.1:' + server.address().port;

// Every page of the PDF carries this footer. Header/footer templates cannot
// load web fonts, so IBM Plex Mono falls back to a system monospace.
const FOOTER = `
<div style="width:100%; padding:0 0.6in; font-family:'IBM Plex Mono', Consolas, 'Courier New', monospace;
            font-size:8.5px; line-height:1.5; color:#5b7280; -webkit-print-color-adjust:exact;">
  <div>Wim Roach &middot; 509-528-6691 &middot; wroach@centennialmortgage.com</div>
  <div>Brian Lorenz &middot; 541-760-4377 &middot; blorenz@centennialmortgage.com</div>
  <div>Centennial Mortgage, Inc. &middot; roachlorenz.com &middot; Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
</div>`;

let browser;
try {
  // Prefer the installed Chrome so no browser download is needed; fall back
  // to Playwright's own Chromium if it has been installed.
  try { browser = await chromium.launch({ channel: 'chrome' }); }
  catch { browser = await chromium.launch(); }

  const page = await browser.newPage();
  // No analytics hits from a build.
  await page.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com/, r => r.abort());
  await page.goto(local + '/resources/' + slug + '/', { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);

  // Links must work from the PDF, which is opened far from localhost:
  // root-relative internal links become absolute on the live site.
  const rewritten = await page.evaluate((origin) => {
    let n = 0;
    for (const a of document.querySelectorAll('a[href]')) {
      const h = a.getAttribute('href');
      if (h.startsWith('/') && !h.startsWith('//')) { a.setAttribute('href', origin + h); n++; }
    }
    return n;
  }, ORIGIN);

  const outDir = path.join(ROOT, 'assets', 'pdf');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, slug + '.pdf');
  await page.pdf({
    path: out,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: FOOTER,
    // The bottom margin holds the three-line footer with room to spare.
    margin: { top: '0.6in', right: '0.6in', bottom: '0.95in', left: '0.6in' },
  });
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log('Wrote ' + path.relative(ROOT, out) + ' (' + kb + ' KB; ' + rewritten + ' internal links made absolute)');
} finally {
  if (browser) await browser.close();
  server.close();
}
