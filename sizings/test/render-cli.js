'use strict';

/**
 * Dev CLI for the pipeline. Parses an Export-tab paste file, renders the live
 * sizing page, and (optionally) the matching email snippet.
 *
 * Usage:
 *   node test/render-cli.js <paste.txt> [options]
 *
 * Options:
 *   --out <file>        write rendered HTML here (default: <paste>.html)
 *   --preview          render with the "Internal Preview" watermark
 *   --stale            render with the stale (pricing-moved) banner
 *   --stale-date <s>   date shown in the stale banner (default: today)
 *   --url <url>        public URL used in the sizing-link button
 *   --email <file>     also write the email snippet HTML here
 *
 * Exit code is non-zero if the paste fails validation.
 */

const fs = require('fs');
const path = require('path');
const { parseExportTab, isValid, slugify } = require('../lib/parser');
const { renderSizingPage } = require('../lib/render');
const { extractTerms } = require('../lib/terms');
const { buildEmailSnippet } = require('../lib/email');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
function flag(name) {
  return process.argv.includes(name);
}

const pasteFile = process.argv[2];
if (!pasteFile || pasteFile.startsWith('--')) {
  console.error('Usage: node test/render-cli.js <paste.txt> [--out f] [--preview] [--stale] [--url u] [--email f]');
  process.exit(2);
}

const paste = fs.readFileSync(pasteFile, 'utf8');
const parsed = parseExportTab(paste);

const errs = parsed.errors.filter((e) => e.severity === 'err');
if (errs.length) {
  console.error(`\n${errs.length} validation error(s):`);
  errs.forEach((e) => console.error('  -', e.label, '—', e.msg));
}
const warns = parsed.errors.filter((e) => e.severity !== 'err');
if (warns.length) {
  console.error(`\n${warns.length} warning(s):`);
  warns.forEach((e) => console.error('  -', e.label, '—', e.msg));
}
if (!isValid(parsed)) {
  console.error('\nPaste is not valid — not rendering.');
  process.exit(1);
}

const r = parsed.results;
const v = (k) => (r[k] ? r[k].value : '');
const slug = slugify(v('propertyName'), v('city'), v('state'));

const opts = {
  preview: flag('--preview'),
  stale: flag('--stale'),
  staleDate: arg('--stale-date', null)
};
const html = renderSizingPage(parsed, opts);

const outFile = arg('--out', pasteFile.replace(/\.[^.]+$/, '') + '.html');
fs.writeFileSync(outFile, html);

console.log('\nRendered:');
console.log('  property :', v('propertyName'), '—', v('city') + ',', v('state'));
console.log('  slug     :', slug);
console.log('  fields   :', Object.keys(r).length, '| notes:', parsed.notes.length);
console.log('  flags    :', [opts.preview && 'preview', opts.stale && 'stale'].filter(Boolean).join(', ') || 'none');
console.log('  -> ', path.resolve(outFile));

// Email snippet (optional) — terms come from the rendered page itself.
const emailFile = arg('--email', null);
if (emailFile) {
  const terms = extractTerms(html);
  const { subject, html: emailHtml } = buildEmailSnippet(parsed, terms, {
    url: arg('--url', '#')
  });
  fs.writeFileSync(emailFile, emailHtml);
  console.log('\nEmail snippet:');
  console.log('  subject  :', subject);
  console.log('  terms    :', terms.loan, '|', terms.rate, '|', terms.dscr, '|', terms.term);
  console.log('  -> ', path.resolve(emailFile));
}
