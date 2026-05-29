'use strict';

/**
 * Publish orchestration. Pure logic — no network, no Netlify, no GitHub. It is
 * handed a storage adapter (local fs here; GitHub-commit in prod) and does the
 * sequence the handoff specifies:
 *
 *   parse -> validate -> slug -> render page -> store -> supersede old URLs
 *   -> extract terms -> build email -> return { slug, url, page, email }
 *
 * Supersession (handoff anti-anchoring decision): republishing a property mints
 * a NEW sizing URL; every prior URL for that property is replaced by a redirect
 * stub pointing at the new one. No borrower-visible archive.
 *
 * Soft expiry: markStaleSizings() is the daily job — any current, non-preview
 * sizing older than the stale window gets re-rendered with the gray banner on.
 *
 * Internal previews are excluded from both supersession and expiry.
 */

const { parseExportTab, isValid, slugify } = require('./parser');
const { renderSizingPage } = require('./render');
const { extractTerms } = require('./terms');
const { buildEmailSnippet } = require('./email');
const { buildRedirectStub } = require('./stub');

const STALE_DAYS = 30;

// Chosen email button style (Brian, May 2026): solid orange.
// Options: 'orange' | 'navy' | 'keyline' (see lib/email.js buildButton).
const EMAIL_BUTTON_STYLE = 'orange';

function publicUrl(baseUrl, slug) {
  return String(baseUrl || '').replace(/\/+$/, '') + '/' + slug;
}

function addDays(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// base, base-2, base-3, ... among existing non-preview records for this base.
async function mintSlug(store, baseSlug) {
  const taken = new Set(
    (await store.listRecords())
      .filter((r) => r.baseSlug === baseSlug && !r.preview)
      .map((r) => r.slug)
  );
  if (!taken.has(baseSlug)) return baseSlug;
  let n = 2;
  while (taken.has(`${baseSlug}-${n}`)) n++;
  return `${baseSlug}-${n}`;
}

async function mintPreviewSlug(store, baseSlug) {
  const taken = new Set((await store.listRecords()).map((r) => r.slug));
  const base = `${baseSlug}-preview`;
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * @param {string} paste   Excel HTML Export tab paste
 * @param {object} opts    { baseUrl, preview=false, now=new Date(), staleDays=30 }
 * @param {object} store   storage adapter (see storage-local.js)
 * @returns {{slug, url, page, email, record, parsed}}
 * @throws  {Error} with .errors if the paste fails validation
 */
async function publishSizing(paste, opts, store) {
  opts = opts || {};
  const now = opts.now ? new Date(opts.now) : new Date();
  const staleDays = opts.staleDays == null ? STALE_DAYS : opts.staleDays;
  const preview = !!opts.preview;

  const parsed = parseExportTab(paste);
  if (!isValid(parsed)) {
    const err = new Error('Sizing paste failed validation; not publishing.');
    err.errors = parsed.errors.filter((e) => e.severity === 'err');
    throw err;
  }

  const v = (k) => (parsed.results[k] ? parsed.results[k].value : '');
  // NOTE: handoff says slug = property + city. We also include state, so two
  // same-named properties in different states cannot collide and accidentally
  // supersede each other. One-line change in parser.slugify if you want city-only.
  const baseSlug = slugify(v('propertyName'), v('city'), v('state'));

  const slug = preview ? await mintPreviewSlug(store, baseSlug) : await mintSlug(store, baseSlug);
  const url = publicUrl(opts.baseUrl, slug);

  const publishedAt = now.toISOString();
  const page = renderSizingPage(parsed, { preview, stale: false, template: opts.template });
  const terms = extractTerms(page);

  const record = {
    slug,
    baseSlug,
    status: 'current',
    supersededBy: null,
    preview,
    publishedAt,
    staleAt: preview ? null : addDays(publishedAt, staleDays),
    stale: false,
    property: { name: v('propertyName'), city: v('city'), state: v('state') },
    terms,
    parsed
  };

  await store.putRecord(record);
  await store.putPage(slug, page);

  // Supersede prior non-preview URLs for this property (skip when publishing a preview).
  const superseded = [];
  if (!preview) {
    for (const old of await store.listRecords()) {
      if (old.preview || old.baseSlug !== baseSlug || old.slug === slug) continue;
      old.status = 'superseded';
      old.supersededBy = slug;
      old.stale = false;
      await store.putRecord(old);
      await store.putPage(old.slug, buildRedirectStub(url));
      superseded.push(old.slug);
    }
  }

  const { subject, html: email } = buildEmailSnippet(parsed, terms, { url, buttonStyle: EMAIL_BUTTON_STYLE });

  return { slug, url, page, email, emailSubject: subject, record, parsed, superseded };
}

/**
 * Daily soft-expiry job. Re-renders any current, non-preview sizing past its
 * stale date with the gray "pricing has likely moved" banner. Returns the slugs
 * it marked. Brian/Wim refresh by republishing, or extend via extendSizing().
 */
async function markStaleSizings(store, opts) {
  opts = opts || {};
  const now = opts.now ? new Date(opts.now) : new Date();
  const marked = [];
  for (const rec of await store.listRecords()) {
    if (rec.preview || rec.status !== 'current' || rec.stale || !rec.staleAt) continue;
    if (now >= new Date(rec.staleAt)) {
      const page = renderSizingPage(rec.parsed, {
        preview: false,
        stale: true,
        staleDate: rec.publishedAt,
        template: opts.template
      });
      rec.stale = true;
      await store.putRecord(rec);
      await store.putPage(rec.slug, page);
      marked.push(rec.slug);
    }
  }
  return marked;
}

/** Reset a sizing's stale clock without republishing (the "extend" action). */
async function extendSizing(store, slug, opts) {
  opts = opts || {};
  const now = opts.now ? new Date(opts.now) : new Date();
  const staleDays = opts.staleDays == null ? STALE_DAYS : opts.staleDays;
  const rec = await store.getRecord(slug);
  if (!rec || rec.preview) return null;
  rec.staleAt = addDays(now.toISOString(), staleDays);
  rec.stale = false;
  await store.putRecord(rec);
  await store.putPage(slug, renderSizingPage(rec.parsed, { preview: false, stale: false, template: opts.template }));
  return rec;
}

module.exports = { publishSizing, markStaleSizings, extendSizing, STALE_DAYS };
