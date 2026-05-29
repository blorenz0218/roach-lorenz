'use strict';

/**
 * Generates the email snippet Brian/Wim paste into Outlook when a sizing is
 * published. It is intentionally minimal: a single button linking to the live
 * sizing page. The person writes the surrounding email (greeting, deal context,
 * sign-off) themselves, so the snippet stays out of the way and reads like a
 * person sharing a link rather than a marketing blast.
 *
 * FONT: email clients don't load web fonts (Catamaran), so the button text uses
 * the recipient's native UI font — Segoe UI on Windows/New Outlook, San Francisco
 * on Mac, Roboto on Android — which matches the Publisher preview.
 *
 * OUTLOOK NOTES: right-angle flat button only (no radius/gradient/shadow — both
 * the brand and Outlook forbid them). Techniques chosen to survive New Outlook's
 * paste sanitizer: bgcolor attribute for the fill, an inner <span> carrying the
 * text color + no-underline (Outlook overrides color on <a> but respects it on a
 * child span), and a 1px border via the td for the keyline style.
 */

const NAVY = '#004e72';
const NAVY_DEEP = '#002a3d';
const ORANGE = '#f98e2b';
const WHITE = '#ffffff';
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Outlook-safe flat button. style: 'orange' | 'navy' | 'keyline'
function buildButton(url, label, style) {
  const href = esc(url || '#');
  const text = esc(label);

  let fill, textColor, border;
  if (style === 'navy') {
    fill = NAVY; textColor = WHITE; border = '';
  } else if (style === 'keyline') {
    fill = ORANGE; textColor = NAVY_DEEP; border = `border:1px solid ${NAVY_DEEP};`;
  } else { // 'orange' (default)
    fill = ORANGE; textColor = NAVY_DEEP; border = '';
  }

  // Outlook's compose paste clamps font-size on links to its own default and
  // collapses letter-spacing, which made earlier versions render tiny. Tested fix
  // (Option A): carry typography on the TABLE CELL, drop letter-spacing entirely,
  // keep link styling minimal. This renders bold, full-size, and consistent on
  // paste into New Outlook. bgcolor on the td keeps the fill; align="center"
  // centers the label; mso-padding-alt gives Outlook the padding it understands.
  const tdStyle = `background:${fill};${border}padding:16px 44px;`
    + `font-family:${FONT};font-size:16pt;font-weight:bold;color:${textColor};`
    + `mso-padding-alt:16px 44px;`;
  const aStyle = `color:${textColor};text-decoration:none;font-size:16pt;font-weight:bold;`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">`
    + `<tr><td bgcolor="${fill}" align="center" style="${tdStyle}">`
    + `<a href="${href}" style="${aStyle}">${text}&nbsp;&rarr;</a>`
    + `</td></tr></table>`;
}

/**
 * @param {object} parsed  parser.parseExportTab() output
 * @param {object} terms   computed headline figures (unused in button-only mode;
 *                         kept in the signature so callers don't change)
 * @param {object} opts    { url, buttonStyle='orange', label='View the Sizing' }
 * @returns {{subject:string, html:string}}
 *          `subject` is a suggested subject line (not part of the pasted HTML).
 *          `html` is the snippet to paste into Outlook.
 */
function buildEmailSnippet(parsed, terms, opts) {
  opts = opts || {};
  const r = parsed.results;
  const v = (k) => (r[k] ? r[k].value : '');

  const propertyName = v('propertyName') || 'your property';
  const city = v('city');
  const subject = `223(f) sizing on ${propertyName}${city ? ' in ' + city : ''}`;

  const label = opts.label || 'View the Sizing';
  const button = buildButton(opts.url, label, opts.buttonStyle || 'orange');

  const html = `<div style="font-family:${FONT};">${button}</div>`;

  return { subject, html };
}

module.exports = { buildEmailSnippet, buildButton };
