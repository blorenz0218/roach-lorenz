'use strict';

/**
 * Production storage adapter: commits records and pre-rendered pages to a GitHub
 * repo via the Contents API. Implements the SAME interface as storage-local.js
 * (getRecord / putRecord / listRecords / putPage / getPage), so publish.js runs
 * against it unchanged. Netlify serves the committed files statically.
 *
 * Layout in the repo (matches the local adapter):
 *   data/<slug>.json            the record
 *   sizings/<slug>/index.html   the served page or redirect stub
 *
 * CREDENTIALS: the token is read from the environment (config.token), which in
 * production is a Netlify environment variable set by Brian. This module never
 * hardcodes or logs it.
 *
 * STATUS: written to the interface and the GitHub Contents API contract, but not
 * exercised against a live repo from this sandbox (no token here by design).
 * Brian's Claude Code, with repo access, should run it end to end before relying
 * on it — see the deploy handoff prompt.
 *
 * Requires Node 18+ (global fetch).
 */

function b64encode(str) { return Buffer.from(str, 'utf8').toString('base64'); }
function b64decode(str) { return Buffer.from(str, 'base64').toString('utf8'); }

/**
 * @param {object} config { owner, repo, branch='main', token, committer?, dataDir?, pagesDir? }
 *   committer: { name, email } stamped on commits (defaults to a bot identity).
 *   dataDir:   commit path for record JSON. Defaults to 'data'.
 *   pagesDir:  commit path for served HTML. Defaults to 'sizings' (original handoff
 *              layout); in this repo we pass 's' so it doesn't collide with the
 *              /sizings/ source folder.
 */
function createGitHubStore(config) {
  const owner = config.owner;
  const repo = config.repo;
  const branch = config.branch || 'main';
  const token = config.token;
  const committer = config.committer || { name: 'Sizing Publisher', email: 'sizings@centennialmortgage.com' };
  const dataDir = (config.dataDir || 'data').replace(/^\/+|\/+$/g, '');
  const pagesDir = (config.pagesDir || 'sizings').replace(/^\/+|\/+$/g, '');
  if (!owner || !repo || !token) throw new Error('createGitHubStore requires { owner, repo, token }');

  const api = `https://api.github.com/repos/${owner}/${repo}/contents`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'centennial-sizing-pipeline'
  };

  async function getFile(repoPath) {
    const res = await fetch(`${api}/${encodeURI(repoPath)}?ref=${encodeURIComponent(branch)}`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub GET ${repoPath} -> ${res.status} ${await res.text()}`);
    const json = await res.json();
    return { sha: json.sha, content: b64decode(json.content.replace(/\n/g, '')) };
  }

  async function putFile(repoPath, content, message) {
    const existing = await getFile(repoPath); // need the sha to update an existing file
    const body = {
      message: message || `publish ${repoPath}`,
      content: b64encode(content),
      branch,
      committer
    };
    if (existing) body.sha = existing.sha;
    const res = await fetch(`${api}/${encodeURI(repoPath)}`, {
      method: 'PUT', headers, body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`GitHub PUT ${repoPath} -> ${res.status} ${await res.text()}`);
    return res.json();
  }

  return {
    async getRecord(slug) {
      const f = await getFile(`${dataDir}/${slug}.json`);
      return f ? JSON.parse(f.content) : null;
    },
    async putRecord(record) {
      await putFile(`${dataDir}/${record.slug}.json`, JSON.stringify(record, null, 2), `record: ${record.slug}`);
    },
    async listRecords() {
      const res = await fetch(`${api}/${encodeURIComponent(dataDir)}?ref=${encodeURIComponent(branch)}`, { headers });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`GitHub LIST ${dataDir} -> ${res.status} ${await res.text()}`);
      const items = await res.json();
      const out = [];
      for (const it of items) {
        if (it.type === 'file' && it.name.endsWith('.json')) {
          const f = await getFile(`${dataDir}/${it.name}`);
          if (f) out.push(JSON.parse(f.content));
        }
      }
      return out;
    },
    async putPage(slug, html) {
      await putFile(`${pagesDir}/${slug}/index.html`, html, `page: ${slug}`);
    },
    async getPage(slug) {
      const f = await getFile(`${pagesDir}/${slug}/index.html`);
      return f ? f.content : null;
    }
  };
}

module.exports = { createGitHubStore };
