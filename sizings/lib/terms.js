'use strict';

/**
 * Extracts the headline terms for the email snippet by loading the *rendered
 * page* in a headless DOM and reading the cells the chassis's own recalculate()
 * computed. This makes the page the single source of truth: the email can never
 * disagree with the page, because the numbers come from the same math engine.
 *
 * The handoff explicitly warns against re-implementing the sizing math on the
 * server (divergence risk). This honors that: zero math here, just DOM reads.
 */

const { JSDOM } = require('jsdom');

/**
 * @param {string} renderedHtml  output of render.renderSizingPage()
 * @returns {{loan, rate, dscr, term, perUnit, propertyName, monthlyPayment}}
 *          all formatted display strings, exactly as the page shows them.
 */
function extractTerms(renderedHtml) {
  const dom = new JSDOM(renderedHtml, { runScripts: 'dangerously' });
  const doc = dom.window.document;
  const txt = (id) => {
    const el = doc.getElementById(id);
    return el ? el.textContent.trim() : '';
  };

  // pmTerm reads e.g. "420 months (35 yrs)" -> present the years form to borrowers.
  const rawTerm = txt('pmTerm');
  const yrMatch = rawTerm.match(/\((\d+)\s*yrs?\)/);
  const term = yrMatch ? `${yrMatch[1]}-year (${rawTerm.replace(/\s*\(.*\)$/, '')})` : rawTerm;

  const propEl = doc.querySelector('.property-name');

  const out = {
    loan: txt('hsLoan'),
    rate: txt('hsRate'),
    mip: txt('pmMipRate'),
    dscr: txt('hsDscr'),
    perUnit: txt('hsPerUnit'),
    monthlyPayment: txt('pmTotal'),
    term,
    propertyName: propEl ? propEl.textContent.trim() : ''
  };

  dom.window.close();
  return out;
}

module.exports = { extractTerms };
