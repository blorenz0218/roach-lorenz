# roachlorenz.com

Personal brand site for Brian Lorenz and Wim Roach, both Vice Presidents at Centennial Mortgage, Inc. Target audience is HUD/FHA multifamily mortgage prospects — property owners, developers, syndicators, and property management companies. Primary geography is Pacific Northwest and Mountain West with national reach. Goals are SEO/AEO visibility, trust-building for cold-call prospects, white paper distribution, and inbound lead generation. The brand operates independently of any specific lender.

## Who we are

- **Brian Lorenz** — Vice President. Former Senior HUD Underwriter at Colliers Mortgage with a 100% HUD Firm Commitment success rate (never had a deal rejected). Lives in Boise, ID.
- **Wim Roach** — Vice President. Extensive borrower relationships and closed transaction volume.

The public-facing title is always **"Vice President"** — never a variant naming Originations — in page copy, author tags, and JSON-LD jobTitle alike.

## Loan programs featured

Primary: **223(f)** (refinance/acquisition of stabilized multifamily), **221(d)(4)** (new construction/substantial rehab).
Secondary: 241(a) supplemental loans, 223(a)(7) refinance, BSPRA structuring.

## Hosting and deployment

- **Repo:** GitHub
- **Deploy:** Netlify auto-deploy on push to main
- **Analytics:** Google Analytics 4, measurement ID `G-H3Y2SPVQSK`
- **Search:** Google Search Console configured

## Design system

**Design System v2 — "The Underwriter's Desk"** (rolled out across the homepage and all resource articles). Light, paper-toned, editorial. No border-radius anywhere.

**Canonical stylesheet:** the entire `<style>` block in `resources/how-hud-sizes-a-223f-mortgage/index.html` is the single source of truth. A new resource page copies that block verbatim — do not retype or "improve" it. (The homepage carries its own copy of the same system inline.)

**Fonts** — Source Serif 4 (display/serif headings), IBM Plex Sans (body/UI), IBM Plex Mono (data/labels). Canonical fonts `<link>` for every page:

```html
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
```

**Tokens:** paper `#f6f8f8`, ink `#132b36`, blue `#04567c`, blue-deep `#003a55`, mid `#5b7280`, body-text `#33505d`, rule `#cfd9dd`, marker (orange) `#e8821f`, marker-tint `#fdf3e7`, tint `#eef4f7`, card `#ffffff`. Fonts as `--serif` / `--sans` / `--mono`.

**Legacy aliases** live in the canonical stylesheet's `:root` so older inline styles and inline-JS `var()` refs keep working — leave them, and leave existing inline styles untouched: `--text-muted`→mid, `--text`→ink/body-text, `--text-soft`→body-text, `--navy`→ink, `--gold`→marker, `--gold-border`→rule.

**Retired — must not appear in any new page:** the v1 navy/gold palette, `--navy`/`--gold` as *primary* tokens (only the aliases above remain), Playfair Display, and DM Sans. A dark band is still allowed where intentional (e.g. the homepage contact CTA uses `--blue-deep` with light text) — but build it from v2 tokens, never the retired ones.

**Per-page supplements:** some articles use components the canonical stylesheet doesn't cover (charts, timelines, comparison widgets, calculators). Those carry a clearly-marked `/* PAGE-SPECIFIC SUPPLEMENT — review */` block at the end of their `<style>`, composed only from v2 tokens. When adding such a component, keep its old visual role (a highlighted box stays a highlighted box — `--marker-tint` with an ink border) and never put dark text on a dark background.

### Site header and footer (standard)

Two header patterns exist site-wide — do not invent others:

- **Homepage**: wordmark left; its own section-anchor nav (Why HUD / Process / Programs / Resources / Team / Quarterly) + a "Get in Touch" button to `#contact`.
- **Every interior page** (white papers, newsletter archive, issues): wordmark left; a right-justified cluster of Resources / Quarterly / Team links + a "Get in Touch" button.

Shared link treatment on both: nav links are IBM Plex Mono, 11.5px, weight 500, uppercase, letter-spacing 0.08em, color `--mid` (hover `--blue`). The CTA is the blue-deep button component: sans 13px/600, white text on `--blue-deep`, `padding: 11px 22px`, hover `--blue`. On mobile the links hide; wordmark + button remain.

Canonical interior header markup (a new page copies this block and the NAV CSS rules — `.nav-links` / `.nav-btn` — from any existing paper):

```html
<nav>
  <div class="nav-inner">
    <a href="/" class="nav-brand">Wim Roach <span>&amp;</span> Brian Lorenz</a>
    <ul class="nav-links">
      <li><a href="/#resources">Resources</a></li>
      <li><a href="/newsletter/">Quarterly</a></li>
      <li><a href="/#team">Team</a></li>
    </ul>
    <a href="/#contact" class="nav-btn">Get in Touch</a>
  </div>
</nav>
```

(The newsletter template names the same button class `.nav-cta` — equivalent component, keep whichever the template you're copying uses.)

Footer standard on every page: wordmark + tagline left; link list Programs · Process · Resources · Team · Quarterly · Contact (mono 12.5px, `flex-wrap: wrap`); MAP-lender disclaimer below. Homepage section anchors that exist: `#why-hud #process #programs #resources #team #contact` — there is no `#products`.

Homepage deep-link note: sections carry `scroll-margin-top: 80px` and the homepage has a post-load re-anchor script for `/#section` links — the GSAP pinned timeline inserts a tall spacer after the browser's initial hash jump, which otherwise strands visitors above their target. Do not remove either when editing homepage styles/scripts.

### Hero entrance animation (required on white papers)

Every white paper page includes a staggered fade-up entrance animation on the hero block. Four elements cascade in over 0.4 seconds when the page loads. Pure CSS, no JavaScript.

Add this block at the end of the page's `<style>` section:

```css
/* Entrance animation */
.cover-series { opacity: 0; animation: fadeUp 0.6s ease forwards 0.1s; }
.cover-inner > h1 { opacity: 0; animation: fadeUp 0.6s ease forwards 0.2s; }
.cover-lede { opacity: 0; animation: fadeUp 0.6s ease forwards 0.3s; }
.cover-meta { opacity: 0; animation: fadeUp 0.6s ease forwards 0.4s; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

This targets the `cover` hero template (the canonical template used on 8 of 9 pages). `.cover-subtitle` and `.cover-rule` are intentionally left unanimated to keep the cascade to 4 elements.

The `hud-223f-checklist` page uses a different hero template (`.article-*` classes instead of `.cover-*`) and has its own version of the same animation. Don't try to unify the templates — just make sure any new paper uses the `cover` template and gets the animation above.

## Writing voice (critical)

Brian's voice is the standard for all long-form content. Characteristics:

- Technical and precise, but written the way a practitioner talks — not the way a consultant writes
- First person and "we" throughout; direct address to the reader where natural
- Explanations built through mechanics and specifics, not through editorial emphasis
- Real HUD terminology used without explaining basics: MAP, PCNA, HEROS, DSCR, LTC, BSPRA, MIP, HCP, etc.
- No pull quotes; no duplicative sentences; points made once and moved on

**Do not write these patterns:**

- Short declarative "landing sentences" at paragraph endings that restate or editorialize on what the previous sentence already said. Examples to avoid: "That's the program." / "Here's why that matters." / "That's a meaningful cost difference." / "Get in front of this early."
- "That said," as a transition
- Framing sentences like "What makes it interesting is..." or "The key thing to understand is..." — just say the thing

## Domain accuracy

Brian supplies exact figures when they matter — do not calculate independently when he provides numbers. Key recurring parameters:

- LTV: 87% market rate, 90% affordable
- DSCR: 1.15x market rate, 1.11x affordable
- Cash-out governed by greater of 80% LTV or total refi cost
- Repair escrow: 120%
- Third-party shelf lives: 120 days (market study, appraisal), 180 days (Phase I ESA)
- HCP factor: 270%
- MIP: 0.25% flat
- Cost Not Attributable: 10% of appraised value

Terminology: the canonical term for the debt-service-coverage-based NOI is **"DSCR NOI"** (not "Debt Service NOI"). Use it consistently in titles, body, and schema.

Primary source documents: HUD MAP Guide, HUD Form HUD-92466M (Regulatory Agreement), Fannie Mae Form 6001.NR, Freddie Mac Seller/Servicer Guide.

## SEO standard for every page

Every page ships with:

- Article schema
- FAQPage schema
- HowTo schema where applicable
- Open Graph and Twitter Card tags
- Semantic HTML: H1/H2 hierarchy, article wrapper, time element
- Visible publish date
- Five-question FAQ section targeting long-tail queries

Homepage exemption: the homepage uses a ProfessionalService + Person `@graph` instead of Article and FAQPage schema — this is correct and audits should not flag it.

### Program-number variants

Every resource page should include the unpunctuated program-number variants (223f, 221d4, 241a, 223a7) at least once naturally in visible body or FAQ text alongside the punctuated forms — these variants carry real search volume. One natural mention is enough; do not keyword-stuff.

### Canonical URL requirements

Canonical URLs for /resources/[slug] pages MUST include a trailing slash, matching the URL Netlify actually serves (e.g., https://roachlorenz.com/resources/hud-apartment-loans/). The homepage canonical is the bare domain with trailing slash (https://roachlorenz.com/). This applies to the <link rel='canonical'> tag, the og:url meta tag, and any self-referencing @id or url fields in JSON-LD schemas — all should match the trailing-slash form.

### Title tag requirements

- Keep titles **60 characters or fewer** (Google truncates in SERPs beyond this)
- Drop the "| Wim Roach & Brian Lorenz" author suffix on white papers — the domain already shows below each search result
- Keep the author suffix only on the homepage title
- Lead with the specific HUD program number when applicable (e.g., "HUD 241(a)...", "HUD 221(d)(4)...") — these are the primary search terms — unless GSC query data supports a different phrasing (e.g., "How HUD Sizes a 223(f)..." matches real query patterns)

### Meta description requirements

- Keep descriptions **150–160 characters**
- Write as a pitch, not an abstract — answer "why would someone click?"
- Lead with the specific topic/program; mention credentials second where room allows
- These are seen by real humans in Google search results (not just crawlers), so they drive clickthrough

### Open Graph preview image requirements

Every page must have a working og:image, or social preview cards (LinkedIn, iMessage, Slack, Twitter/X) will render blank.

- Create a 1200×630 PNG using the og:image template (stored separately from the repo)
- Save as `og-[topic].png` in `/assets/` (the naming convention — match the pattern of existing images)
- Reference the image in these tags on the page:
  - `<meta property="og:image" content="https://roachlorenz.com/assets/og-[topic].png">`
  - `<meta property="og:image:width" content="1200">`
  - `<meta property="og:image:height" content="630">`
  - `<meta name="twitter:image" content="https://roachlorenz.com/assets/og-[topic].png">`
  - JSON-LD Article schema `"image"` field — also point to the same PNG URL
- Use `<meta name="twitter:card" content="summary_large_image">` (not `summary`) so the full 1200×630 image renders as a banner on Twitter/X
- Use `.png` (not `.jpg`) to match the existing file convention in `/assets/`
- Verify the preview renders correctly at linkedin.com/post-inspector after deploy

## Mobile overflow — recurring issue

Standard fixes applied to every white paper:

- `min-width: 0` on grid children
- `overflow-x: hidden` on html and body
- `overflow-wrap: break-word` on paragraphs
- Responsive breakpoints for timeline and comparison table elements

## Page structure convention

All resource/white paper pages are delivered as `index.html` inside a subfolder under `/resources/` (e.g., `resources/hud-223f-checklist/index.html`). This lets Netlify serve clean URLs without `.html` extensions.

## New page deployment checklist

Every new page, no exceptions:

1. Add Google Analytics tag `G-H3Y2SPVQSK` immediately after the opening `<head>` element
2. Verify `<title>` is ≤60 characters and `<meta name="description">` is 150–160 characters
3. Verify og:image, twitter:image, and JSON-LD `image` all point to a real PNG that exists in `/assets/`
4. Confirm `twitter:card` is set to `summary_large_image` (not `summary`)
5. Confirm canonical URL matches the site pattern: `https://roachlorenz.com/resources/[folder-name]/` with a trailing slash and no `.html` extension — and that og:url and any self-referencing JSON-LD `@id`/`url` fields use the same trailing-slash form
6. Confirm the hero entrance animation (fadeUp cascade on `.cover-series`, h1, `.cover-lede`, `.cover-meta`) is present in the page's `<style>` block
7. Confirm the standard interior header (wordmark + Resources/Quarterly/Team + Get in Touch button) and standard footer are present — copy both from an existing paper
8. Update `sitemap.xml` with the new URL
9. Push all updated files to GitHub
10. Google Search Console → URL Inspection → paste new URL → Request Indexing
11. After deploy, test the social preview at linkedin.com/post-inspector

## Workflow split

- **Claude project chat (claude.ai)** = iterative page building and white paper drafting. Back-and-forth content work.
- **Claude Code (this environment)** = cross-site operations: wiring new pages into index, auditing SEO tags across all files, applying global updates, git operations, deployment prep.

## Where published content lives

The `/resources/` folder is the source of truth for what's published. Each subfolder contains one white paper or article as `index.html`. To see what exists, look there directly rather than relying on a list in this file.

The **241(a) Supplemental Loan white paper** (`resources/hud-241a-supplemental-loan/index.html`) is the canonical style reference — match its voice and structure for any new long-form content.

## Change log

- **2026-07-13:** Standardized site headers. Interior pages (papers + newsletter) now share one header: wordmark + right-justified Resources/Quarterly/Team links + Get in Touch button, replacing the old wordmark + "← All Resources" back-link pattern. Homepage keeps its section-anchor nav but adopts the mono-uppercase link treatment, and its CTA became the Get in Touch button. Also fixed `/#section` deep links from interior pages (GSAP pin-spacer shifted anchor targets after the initial jump; homepage now re-anchors post-load and sections have scroll-margin-top).
- **2026-06-17:** Updated canonical URL standard for /resources/ pages from no-trailing-slash to with-trailing-slash. Reason: Netlify 301-redirects non-trailing URLs to trailing-slash form (because index.html lives inside directories), which created a canonical conflict — sitemap and canonical tags pointed to URLs that were themselves 301 redirects. Pages began falling into 'Crawled — currently not indexed' status. Fix aligned all canonicals and sitemap entries to the trailing-slash form the server actually serves.
