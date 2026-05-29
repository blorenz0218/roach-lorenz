'use strict';

/**
 * End-to-end proof for the Arc reference deal.
 *
 * Pipeline under test:  paste text -> parseExportTab -> renderSizingPage ->
 * load the real chassis in a headless DOM -> let the chassis's own math run ->
 * read the computed cells -> assert against the delivered Arc figures.
 *
 * Because the chassis's own recalculate() does the math, this proves the whole
 * round trip, not a re-implementation of it.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { parseExportTab, isValid } = require('../lib/parser');
const { renderSizingPage } = require('../lib/render');

const paste = fs.readFileSync(path.join(__dirname, 'arc-paste.txt'), 'utf8');

let failures = 0;
function check(label, got, want) {
  const ok = String(got) === String(want);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(34)} got=${JSON.stringify(got)}  want=${JSON.stringify(want)}`);
}

// ---- 1. Parse ----
const parsed = parseExportTab(paste);
const errs = parsed.errors.filter(e => e.severity === 'err');
console.log('--- PARSE ---');
check('valid (no errors)', isValid(parsed), true);
check('error count', errs.length, 0);
check('fields parsed', Object.keys(parsed.results).length, 36);
check('notes parsed', parsed.notes.length, 4);
check('note[1] continuations', parsed.notes[1].continuations.length, 1);
check('reqLoan -> Max Loan (null)', parsed.results.reqLoan ? parsed.results.reqLoan.value : null, null);
if (errs.length) errs.forEach(e => console.log('   ERR:', e.label, '-', e.msg));

// ---- 2. Render ----
const html = renderSizingPage(parsed);
fs.writeFileSync(path.join(__dirname, 'arc-rendered.html'), html);

// ---- 3. Execute the real chassis math headless ----
const dom = new JSDOM(html, { runScripts: 'dangerously' });
const doc = dom.window.document;
const txt = id => { const el = doc.getElementById(id); return el ? el.textContent.trim() : '(missing #' + id + ')'; };

console.log('\n--- DELIVERED FIGURES (computed by the chassis) ---');
check('Headline loan',        txt('hsLoan'),       '$36,019,600');
check('Headline rate',        txt('hsRate'),       '5.70%');
check('Headline DSCR',        txt('hsDscr'),       '1.149x');
check('Headline per unit',    txt('hsPerUnit'),    '$166,757');
check('Proposed loan',        txt('pmLoan'),       '$36,019,600');
check('Monthly payment',      txt('pmTotal'),      '$205,679');
check('87% LTV',              txt('ltv87Val'),     '$46,308,900');
check('DSCR-constrained',     txt('dscrVal'),      '$36,019,600');
check('Statutory limit',      txt('statVal'),      '$49,225,100');
check('80% LTV',              txt('ltv80Val'),     '$42,582,900');
check('Cost of Refinance',    txt('costRefiVal'),  '$35,347,656');
check('Market value',         txt('mktValue'),     '$53,228,700');
check('Total Sources',        txt('srcTotal'),     '$35,347,656');
check('Total Uses',           txt('useTotal'),     '$35,347,656');
check('Cash Required',        txt('srcCashReq'),   '($812,903)');

console.log('\n--- DATA-DRIVEN INPUT CELLS (formerly hardcoded) ---');
check('MIP rate',             txt('pmMipRate'),         '0.25%');
check('Term',                 txt('pmTerm'),            '420 months (35 yrs)');
check('App fee pct',          txt('pctAppFee'),         '0.30%');
check('Initial MIP pct',      txt('pctInitMIP'),        '0.25%');
check('Financing fee pct',    txt('pctFinFee'),         '0.50%');
check('Prepaid 3rd party',    txt('srcPrepaid3PR'),     '$32,900');
check('Initial reserve dep',  txt('useInitReserve'),    '$324,000');
check('Inspection fee',       txt('useInspection'),     '$1,500');
check('Centennial legal',     txt('useCentennialLegal'),'$25,000');
check('3rd party reports',    txt('useThirdParty'),     '$32,900');
check('Repair assurance',     txt('useRepairAssurance'),'$0');

console.log('\n--- DELIVERED-STATE SANITY ---');
// Editables must seed from delivered values and the page must NOT be "modified" on load.
check('rate editable seed',   doc.querySelector('[data-edit="rate"]').dataset.original, '5.7');
check('existingDebt seed',    doc.querySelector('[data-edit="existingDebt"]').dataset.original, '34500000');
check('no modified editables', doc.querySelectorAll('.editable.is-modified').length, 0);
check('modified banner hidden', doc.getElementById('modifiedBanner').classList.contains('active'), false);
check('property name',        doc.querySelector('.property-name').textContent, 'Arc Apartment Homes');

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
