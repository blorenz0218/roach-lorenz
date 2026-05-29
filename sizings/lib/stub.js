'use strict';

/**
 * Builds the "hard-expired" page that replaces a superseded sizing URL.
 *
 * Per the handoff's anti-anchoring decision: a superseded URL must show NO
 * numbers from the old sizing. It shows a short message and forwards to the
 * current sizing. There is no borrower-visible archive of past sizings.
 *
 * Styling matches the sizing system (Catamaran, navy/orange, right angles,
 * hairlines) — not the Roach Lorenz editorial identity.
 */

const FONT = "'Catamaran', -apple-system, Segoe UI, Roboto, Arial, sans-serif";
const NAVY = '#004e72';
const ORANGE = '#f98e2b';
const INK = '#1a2935';
const MUTE = '#6b7173';
const PANEL = '#f7f8f8';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * @param {string} currentUrl  absolute URL of the current sizing
 * @param {object} [opts]      { delaySeconds = 2 }
 * @returns {string} full HTML document
 */
function buildRedirectStub(currentUrl, opts) {
  opts = opts || {};
  const delay = opts.delaySeconds == null ? 2 : opts.delaySeconds;
  const url = esc(currentUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="${delay};url=${url}">
<title>This sizing has expired</title>
<link href="https://fonts.googleapis.com/css2?family=Catamaran:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;height:100%;}
  body{background:${PANEL};color:${INK};font-family:${FONT};
       display:flex;align-items:center;justify-content:center;}
  .box{max-width:460px;padding:40px;text-align:left;}
  .rule{width:24px;height:1px;background:${ORANGE};margin:0 0 18px;}
  .eyebrow{font:500 11px ${FONT};letter-spacing:0.22em;text-transform:uppercase;color:${MUTE};margin:0 0 14px;}
  h1{font:600 22px/1.25 ${FONT};color:${NAVY};margin:0 0 14px;}
  p{font:400 15px/1.6 ${FONT};color:${INK};margin:0 0 22px;}
  a.btn{display:inline-block;background:${ORANGE};color:${NAVY};text-decoration:none;
        font:600 12px ${FONT};letter-spacing:0.1em;text-transform:uppercase;padding:13px 26px;}
  .fallback{font:400 12px ${FONT};color:${MUTE};margin-top:18px;}
  .fallback a{color:${NAVY};}
</style>
</head>
<body>
  <div class="box">
    <div class="rule"></div>
    <div class="eyebrow">Centennial Mortgage</div>
    <h1>This sizing has expired.</h1>
    <p>The numbers on this page have been replaced by an updated sizing. We're taking you there now.</p>
    <a class="btn" href="${url}">View the current sizing &rarr;</a>
    <div class="fallback">If you are not redirected, <a href="${url}">click here</a>.</div>
  </div>
  <script>setTimeout(function(){location.replace(${JSON.stringify(currentUrl)});}, ${delay * 1000});</script>
</body>
</html>`;
}

module.exports = { buildRedirectStub };
