'use strict';

const fs = require('fs');
const path = require('path');

const CHASSIS_PATH = path.join(__dirname, 'chassis-template.html');

function escapeHTML(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function prettyDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Render a complete, standalone sizing page from a parsed Export tab.
 *
 * @param {object} parsed   output of parser.parseExportTab()
 * @param {object} [opts]
 * @param {boolean} [opts.preview]  render the internal-preview watermark
 * @param {boolean} [opts.stale]    render the gray soft-expiry banner
 * @param {string}  [opts.template] override chassis HTML (defaults to chassis-template.html)
 * @returns {string} full HTML document
 */
function renderSizingPage(parsed, opts) {
  opts = opts || {};
  let html = opts.template != null ? opts.template : fs.readFileSync(CHASSIS_PATH, 'utf8');

  const r = parsed.results;
  const get = (key, fallback) => (r[key] ? r[key].value : (fallback === undefined ? null : fallback));

  const propertyName = get('propertyName', 'Unnamed Property');
  const city = get('city', '');
  const state = get('state', '');
  const units = get('units', 1);
  const txType = get('transactionType', 'Refinance');
  const dealType = get('dealType', 'Market');
  const sizingDate = get('sizingDate');
  const datePretty = prettyDate(sizingDate);

  const reqLoan = get('reqLoan');
  const flags = {
    preview: !!opts.preview,
    stale: !!opts.stale,
    staleDate: datePretty
  };

  // Pipeline flags ride immediately ahead of the (replaced) deal config, in the same script.
  const dealJS = `window.__SIZING__ = ${JSON.stringify(flags)};
const deal = {
  units: ${units},
  marketNOI: ${get('effIncomeValue', 0) - get('opExValue', 0) - get('reservesValue', 0)},
  debtServiceNOI: ${get('effIncomeDS', 0) - get('opExDS', 0) - get('reservesDS', 0)},
  statutoryLimit: ${get('statutoryLimit', 0)},
  ltvMaxMarket: 0.87, ltvMaxAffordable: 0.90,
  ltvCashOutCap: 0.80,
  dscrFactorMarket: 0.87, dscrFactorAffordable: 0.90,
  dscrLabelMarket: '1.15x DSCR Constrained', dscrLabelAffordable: '1.11x DSCR Constrained',
  termMonths: 420,
  mipRate: ${get('mipRate', 0.0025)},
  initialMIPRate: ${get('initialMIPRate', 0.0025)},
  appFeeRate: ${get('appFeeRate', 0.0030)},
  financingFeeRate: ${get('financingFeeRate', 0.0050)},
  prepaid3PR: ${get('prepaid3PR', 0)},
  initialReserveDeposit: ${get('initialReserveDeposit', 0)},
  inspectionFee: ${get('inspectionFee', 0)},
  centennialLegal: ${get('centennialLegal', 0)},
  thirdPartyReports: ${get('thirdPartyReports', 0)},
  repairAssurance: ${get('repairAssurance', 0)},
  processingFee: ${get('processingFee', 0)},
  borrowerOrg: ${get('borrowerOrg', 0)},
  effIncomeValue: ${get('effIncomeValue', 0)},
  effIncomeDS: ${get('effIncomeDS', 0)},
  opExValue: ${get('opExValue', 0)},
  opExDS: ${get('opExDS', 0)},
  reservesValue: ${get('reservesValue', 0)},
  reservesDS: ${get('reservesDS', 0)},
  delivered: {
    dealType: ${JSON.stringify(dealType)},
    rate: ${get('rate', 0)},
    capRate: ${get('capRate', 0)},
    reqLoan: ${reqLoan === null || reqLoan === undefined ? 'null' : reqLoan},
    existingReserve: ${get('existingReserve', 0)},
    existingDebt: ${get('existingDebt', 0)},
    prepay: ${get('prepay', 0)},
    repairs: ${get('repairs', 0)},
    bLegal: ${get('bLegal', 0)},
    titleSurvey: ${get('titleSurvey', 0)}
  }
};`;

  html = html.replace(/const deal = \{[\s\S]*?\n\};/, () => dealJS);

  html = html.replace(/<title>[^<]*<\/title>/,
    `<title>${escapeHTML(propertyName)} — 223(f) Sizing · Centennial Mortgage</title>`);
  html = html.replace(/<div class="property-name">[^<]*<\/div>/,
    `<div class="property-name">${escapeHTML(propertyName)}</div>`);
  html = html.replace(/Great Falls, MT <span class="dot"><\/span> 216 Units/,
    `${escapeHTML(city)}, ${escapeHTML(state)} <span class="dot"></span> ${units} Units`);
  html = html.replace(/<span class="dot"><\/span> Refinance/,
    `<span class="dot"></span> ${escapeHTML(txType)}`);

  if (datePretty) {
    html = html.replace(/Prepared May 27, 2026/g, `Prepared ${datePretty}`);
  }

  const notesHTML = parsed.notes.map(n => {
    let li = `<li>${escapeHTML(n.text)}`;
    if (n.continuations.length > 0) {
      li += '<div style="padding-left:14px; margin-top:4px;">';
      n.continuations.forEach(c => { li += escapeHTML(c) + '<br>'; });
      li += '</div>';
    }
    return li + '</li>';
  }).join('');
  html = html.replace(/<ul>\s*<li>Assumes[\s\S]*?<\/ul>/, () => `<ul>${notesHTML}</ul>`);

  return html;
}

module.exports = { renderSizingPage, escapeHTML, prettyDate };
