'use strict';

/**
 * Regression test for the data-binding fix, using a deal that is NOT Arc.
 *
 * Why this exists: the original chassis hardcoded every input-derived display
 * cell to Arc's values and only data-bound the *computed* cells. For Arc the
 * two coincided, so a round-trip looked perfect while actually being broken for
 * any other deal. This test publishes a deliberately different Affordable deal
 * (Sonoran Vista, Phoenix) whose line items differ from Arc on exactly the cells
 * that used to be hardcoded, and asserts the page reflects THIS deal.
 *
 * It also exercises the Affordable factor swap (90%/90% vs market 87%/87%) and
 * the preview-watermark + stale-banner rendering flags.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { parseExportTab, isValid } = require('../lib/parser');
const { renderSizingPage } = require('../lib/render');

const paste = fs.readFileSync(path.join(__dirname, 'sonoran-paste.txt'), 'utf8');

let failures = 0;
function check(label, got, want) {
  const ok = String(got) === String(want);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(36)} got=${JSON.stringify(got)}${ok ? '' : '  want=' + JSON.stringify(want)}`);
}

// ---- Parse ----
const parsed = parseExportTab(paste);
console.log('--- PARSE ---');
check('valid', isValid(parsed), true);
check('fields parsed', Object.keys(parsed.results).length, 36);
check('notes parsed', parsed.notes.length, 3);

// ---- Render with preview + stale ----
const html = renderSizingPage(parsed, { preview: true, stale: true, staleDate: '2026-04-15' });

const dom = new JSDOM(html, { runScripts: 'dangerously' });
const d = dom.window.document;
const t = (id) => { const e = d.getElementById(id); return e ? e.textContent.trim() : '(missing #' + id + ')'; };

console.log('\n--- FORMERLY-HARDCODED CELLS FOLLOW THIS DEAL, NOT ARC ---');
check('inspection fee (Arc $1,500)', t('useInspection'), '$2,500');
check('centennial legal (Arc $25,000)', t('useCentennialLegal'), '$30,000');
check('initial reserve dep (Arc $324,000)', t('useInitReserve'), '$468,000');
check('prepaid 3rd party (Arc $32,900)', t('srcPrepaid3PR'), '$41,500');
check('3rd party reports (Arc $32,900)', t('useThirdParty'), '$41,500');
check('repair assurance (Arc $0)', t('useRepairAssurance'), '$150,000');

console.log('\n--- EDITABLE SEEDS FOLLOW THIS DEAL ---');
check('rate seed', d.querySelector('[data-edit="rate"]').dataset.original, '5.85');
check('repairs seed (Arc 0)', d.querySelector('[data-edit="repairs"]').dataset.original, '250000');
check('prepay seed (Arc 0)', d.querySelector('[data-edit="prepay"]').dataset.original, '350000');
check('existingReserve seed (Arc 0)', d.querySelector('[data-edit="existingReserve"]').dataset.original, '125000');
check('property name', d.querySelector('.property-name').textContent, 'Sonoran Vista Apartments');
check('no modified editables on load', d.querySelectorAll('.editable.is-modified').length, 0);

console.log('\n--- AFFORDABLE FACTOR SWAP (90% / 90%) ---');
const ltvLabel = [...d.querySelectorAll('*')]
  .map((e) => (e.childNodes.length === 1 ? e.textContent.trim() : ''))
  .find((s) => /^\d+% LTV/.test(s)) || '';
check('LTV criterion shows 90%', /^90% LTV/.test(ltvLabel), true);

console.log('\n--- PREVIEW + STALE CHROME ---');
check('preview-mode body class', d.body.classList.contains('preview-mode'), true);
const sb = d.getElementById('staleBanner');
check('stale banner present', !!sb, true);
check('stale banner visible', sb ? sb.style.display !== 'none' && !sb.hasAttribute('hidden') : false, true);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
