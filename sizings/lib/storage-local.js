'use strict';

/**
 * Storage interface (the contract every adapter implements)
 * ---------------------------------------------------------
 * The orchestrator (publish.js) talks only to this interface, so the same
 * publish logic runs against the local filesystem here and against a
 * GitHub-commit adapter in production without changing.
 *
 *   getRecord(slug)        -> record | null
 *   putRecord(record)      -> void          (record.slug is the key)
 *   listRecords()          -> [record]      (all of them; small dataset)
 *   putPage(slug, html)    -> void          (the served HTML for /sizings/<slug>/)
 *   getPage(slug)          -> string | null
 *
 * A "record" is the JSON blob the handoff describes — one per sizing, keyed by
 * slug. Shape (see publish.js for who sets what):
 *   {
 *     slug, baseSlug,
 *     status: 'current' | 'superseded',
 *     supersededBy: slug | null,
 *     preview: boolean,
 *     publishedAt: ISO string,
 *     staleAt: ISO string,        // publishedAt + 30d; null for previews
 *     stale: boolean,             // set true by the expiry job
 *     property: { name, city, state },
 *     terms: { loan, rate, mip, dscr, term, perUnit },
 *     parsed: <parseExportTab output>   // so the URL keeps working / re-renders
 *   }
 *
 * The local adapter lays files out the way the GitHub/Netlify deploy will:
 *   <root>/sizings/<slug>/index.html   the served page (or redirect stub)
 *   <root>/data/<slug>.json            the record
 */

const fs = require('fs');
const path = require('path');

function createLocalStore(root, config) {
  config = config || {};
  const dataDir = path.join(root, config.dataDir || 'data');
  const pagesDir = path.join(root, config.pagesDir || 'sizings');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(pagesDir, { recursive: true });

  function recordPath(slug) { return path.join(dataDir, slug + '.json'); }
  function pagePath(slug) { return path.join(pagesDir, slug, 'index.html'); }

  return {
    getRecord(slug) {
      const p = recordPath(slug);
      if (!fs.existsSync(p)) return null;
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    },
    putRecord(record) {
      fs.writeFileSync(recordPath(record.slug), JSON.stringify(record, null, 2));
    },
    listRecords() {
      if (!fs.existsSync(dataDir)) return [];
      return fs.readdirSync(dataDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')));
    },
    putPage(slug, html) {
      const p = pagePath(slug);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, html);
    },
    getPage(slug) {
      const p = pagePath(slug);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    }
  };
}

module.exports = { createLocalStore };
