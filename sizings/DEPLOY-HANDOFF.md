# Deploy handoff — sizing publishing pipeline

Paste this to the Claude Code instance connected to the website repo. It assumes
the `sizing-pipeline/` package (this folder) is available to copy in.

---

You're wiring an already-built, already-tested publishing pipeline into this repo
and deploying it on Netlify. **The core logic is done and proven — do not rewrite
it, and do not re-decide the architecture.** Your job is the deploy glue only.

## What's already built (in `sizing-pipeline/lib`, copy it into the repo)

- `parser.js` — Excel "HTML Export" paste → normalized deal object. (`parseExportTab`, `isValid`, `slugify`)
- `chassis-template.html` — the borrower page, fully data-driven.
- `render.js` — `renderSizingPage(parsed, { preview, stale, staleDate })` → page HTML.
- `terms.js` — reads headline figures back out of the rendered page (single source of truth).
- `email.js` — `buildEmailSnippet(parsed, terms, { url })` → minimal paste-into-Outlook snippet (numbers table + link button only).
- `stub.js` — `buildRedirectStub(currentUrl)` → the numberless "expired, redirecting" page.
- `publish.js` — the orchestrator: `publishSizing(paste, opts, store)`, `markStaleSizings(store, opts)`, `extendSizing(store, slug, opts)`. **All async; await every call.**
- `storage-local.js` — filesystem store (dev/testing).
- `storage-github.js` — `createGitHubStore({ owner, repo, branch, token })`, same interface, commits to the repo. **Written but not yet run against a live repo — verify it end to end first (see step 5).**

Run `npm install && npm test` after copying in; all three suites must pass before you build anything.

## Decisions already made — do NOT relitigate

- Hosting: Netlify static + Netlify Functions. Storage: JSON + pre-rendered HTML committed to this repo via the GitHub Contents API. (Not Supabase/Fauna.)
- Repo layout the adapters already assume: `data/<slug>.json` (records), `sizings/<slug>/index.html` (served pages and redirect stubs).
- Slug = property + city + state (we include state so two same-named properties in different states can't collide; the handoff said property+city — flag to Brian only if he objects).
- Supersession: republishing a property mints a new slug; all prior slugs for that property become redirect stubs to the newest. No borrower-visible archive.
- Soft expiry: 30 days; daily job flips the gray banner on; previews and stubs are excluded.

## What to build

1. **`netlify/functions/publish`** — POST, Identity-gated (see 4). Body `{ paste, preview }`. Build a GitHub store from env (below) and call `publishSizing(paste, { baseUrl: process.env.SIZINGS_BASE_URL, preview }, store)`. Return `{ slug, url, email, emailSubject }`. Note: a commit triggers a Netlify rebuild, so the page goes live within ~a minute — surface that in the UI, don't promise instant.

2. **`netlify/functions/expire`** — a Netlify **scheduled function** (daily). Calls `markStaleSizings(store, {})`. No auth (internal cron).

3. **Publisher UI** — already built at `web/publisher.html` (Centennial-styled, self-contained, tested with `test/verify-publisher-ui.js`). It posts `{ paste, preview }` to `PUBLISH_ENDPOINT` (set near the bottom of the file to `/.netlify/functions/publish` — change if your route differs), renders the live URL, previews the email, and has the **Copy email** button that writes `text/html` to the clipboard for New Outlook. Your job: serve it behind Identity and confirm the endpoint route. Don't rebuild it. (`web/publisher-demo.html` is an offline demo with a mocked backend — for reference only, do not deploy it.)

4. **Netlify Identity gate** — registration closed/invite-only; invite Brian + Wim only. The `publish` function must reject anyone not in an allowlist of their two emails (check the Identity user on the function's `context.clientContext`). Serving of published pages stays public.

5. **Verify `storage-github.js` live** before trusting it: from a scratch script with a test repo + token, run a publish, a republish (confirm the first slug's `index.html` becomes the stub), and the expire job. Fix any Contents API edge cases (it handles 404-on-first-write and sha-on-update, but confirm `listRecords` paging if `data/` ever exceeds 1000 files — unlikely soon).

## What Brian does himself (not you, not the other Claude)

- Creates the fine-grained GitHub PAT (contents read/write on this repo only) and sets it as the Netlify env var. **Never put the token in the repo or in code.**
- Sets the env vars in Netlify: `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `SIZINGS_BASE_URL`.
- Confirms the subdomain: `sizings.roachlorenz.com` (confirmed), and points DNS.
- Reviews the first real published page before any borrower link goes out.

## Out of scope here

The real-PDF snapshot button, the 221(d)(4) construction variant, and 223(a)(7)/241(a) are later items — don't build them now.
