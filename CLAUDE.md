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

**Canonical page-layout template:** the article body uses `.page-wrapper` › `.doc-layout` (grid) › `.doc-body` (article) + `.doc-sidebar` (sticky TOC/stat cards), with content sections as `.section-block` and the numbered two-column `.section-header`. Copy this structure for every new page. `.doc-sidebar` carries the required scroll containment — `max-height: calc(100vh - 102px); overflow-y: auto; overscroll-behavior: contain` — so a tall sidebar scrolls independently instead of overlapping the cards below it. **Do NOT copy the `hud-interest-only-vs-amortizing` layout** (`.container` / `.layout` / `.article` / `.sidebar` / `.sticky` / `.side-card`): it's a deprecated one-off kept only because of that page's interactive calculator, and its `.sticky` sidebar lacks the height cap (the exact source of the overlap bug). New pages must use the `.doc-layout` template above.

**Nothing below the article goes inside the layout grid.** The Quarterly card (`.qcard-wrap`), the Continue Reading block (`.readnext`), and the offer strip (`.offer`) are siblings of `.page-wrapper` at body level — after it, never inside it. The grid holds the article and the sidebar and nothing else.

**Standard page tail order**, on every resource page:

```
article (.page-wrapper) → [.offer, two pages only] → .qcard-wrap → .readnext → footer
```

This is not a style preference. For an in-flow grid item, `position: sticky` is constrained by the **grid container's content box**, not by the item's own grid area — so any row added below the article extends the sticky sidebar's travel over it. Put the card inside the grid and the sidebar will scroll down and paint on top of it. `grid-row`, `align-self`, and a taller `max-height` all leave the containing block unchanged and none of them help; `z-index` only decides which element wins the collision. The fix is always structural: move the element out of the grid. This happened on `hud-223f-checklist` (fixed 2026-08-21), where the card and band had been added as grid children and the sidebar overlapped the card by 444px.

One corollary when a page's card sits at body level: the grid gets no bottom padding — `.doc-layout` is `padding: 64px 0 0`, because `.qcard-wrap`'s own 56px top padding supplies the gap.

**The homepage nav has under 3px of slack at its own breakpoint.** It fits on one line at 981px — the narrowest width `@media (max-width:980px)` still shows it — with almost nothing to spare. Adding any nav item, however short, wraps it to two lines, and a wrapped header measures **90.88px** against `scroll-padding-top: 86px`, which puts anchored sections under the nav. Before adding a nav item, measure the wrap band and either widen the 980px breakpoint or raise `scroll-padding-top` to match. The divider between the anchor group and the destination group carries `margin: 0 -16px` for the same reason: a flex child adds a full gap in addition to its own width, so an unmargined 1px divider costs 31px and on its own re-created the wrap between 981 and 1000px.

### Below-article components

**`.readnext` — Continue Reading.** Three curated article rows plus a `.readnext-all` link to `/resources/`. A body-level sibling of `.page-wrapper`, positioned after `.qcard-wrap`, never a grid child. Rows are `display: grid; grid-template-columns: 152px 1fr` — a mono uppercase tag column beside title and description — collapsing to a single column at `max-width: 700px`, where the tag stacks above the title. The tag, title, and description on every row are **copied verbatim from `resources/index.html`**, so the two surfaces never drift; do not retype or reword them. Recommendations are an editorial choice, not keyword similarity — avoid the failure mode where every page points at the same popular paper, and never let a page recommend itself. All 19 resource pages carry exactly one `.readnext`, 57 rows in total.

**`.offer` — a real offer, not a CTA.** One line and one action on `--marker-tint` with a `3px solid var(--marker)` left border, sitting **above** `.qcard-wrap`; the page's `.readnext` still goes below the card. Use it only for something the reader cannot already reach by scrolling. Two pages qualify today: `hud-interest-only-vs-amortizing` (the emailed Excel model) and `hud-223a7-and-irr-loan-modification` (the FHA-number comparison, whose action anchors to `#fha-comparison` — the inline form higher up the same page, so "the form above" stays accurate). This is not a general-purpose CTA slot. A generic "Talk to the Team / View Loan Programs" pairing does not qualify.

**The generic closing band is retired.** `.closing`, `.end-cta`, and `.next-steps` are gone from all 19 resource pages along with their CSS, and no new page gets one. The single exception is `newsletter/2026-q2`, which keeps its `.post-cta` deliberately — a newsletter issue is not a white paper, and continue-reading rows pointing at technical papers would be a category mismatch. Leave it alone.

**`/resources/` is the canonical index.** Every "browse all" or "more resources" link points there. The homepage's old `§7 THE LIBRARY` section and its `id="resources"` anchor no longer exist, so **nothing should link to `/#resources`** — it resolves to the top of the homepage. Site pages are clean; five files under `/sizings/` still carry the dead anchor and are a separate cleanup.

The one page not on this template is `resources/hud-223f-checklist`, which uses `.article-*` classes (`.article-body` / `.article-content` / `.article-sidebar`) instead. The card-and-band rule above still applies there and is already satisfied — the grid holds only the article and the sidebar. What differs is the sidebar: because it isn't `.doc-sidebar`, it can't inherit the standard containment, so it carries a page-local copy scoped inside that page's `@media (min-width: 821px)` block. The page also already contains the full standard `.doc-*` CSS as dead code, so converting the markup is mostly a rename and would retire this exception.

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
- HowTo schema where applicable (see below — deliberate, and not expected to produce rich results)
- Open Graph and Twitter Card tags
- Semantic HTML: H1/H2 hierarchy, article wrapper, time element
- Visible publish date
- FAQ section of at least five questions targeting long-tail queries

Homepage exemption: the homepage uses a ProfessionalService + Person `@graph` instead of Article and FAQPage schema — this is correct and audits should not flag it.

### Schema integrity and internal link form

Four rules, each written because the opposite was found on live pages.

**FAQ schema must match the visible FAQ one-for-one.** Same questions, same order, same answer text. Two failure modes have already happened: FAQPage schema with no visible FAQ section at all (the 241(a) paper), and schema and visible FAQ drifting into two entirely different question sets (the prepayment paper, where 5 of 6 diverged). Google requires FAQ structured data to reflect visible content, and an answer engine cannot cite an answer that exists only in the head. An audit that checks "FAQPage present and parses" passes both defects — check parity, not presence.

**No microdata. JSON-LD only.** Never put `itemscope`, `itemtype`, or `itemprop` on the `<article>` element or anywhere else. Eight pages carried a microdata Article alongside their JSON-LD Article, which hands Google two Article entities and lets it pick one we do not control; one of those pages carried a duplicate microdata FAQPage as well. Removed 2026-08-19. A schema audit scoped to `ld+json` blocks will not see microdata at all — it lives in the body, not the head.

**Entity URLs — three fields, three different values.** Easily confused, and they have been:

| Field | Value |
|---|---|
| `publisher` url | `https://roachlorenz.com/` — the site, trailing slash |
| `worksFor` url | `https://centennialmortgage.com` — the authors' employer |
| author `url` | `https://roachlorenz.com/#team` |
| author `sameAs` | the LinkedIn profile — Brian Lorenz `https://www.linkedin.com/in/lorenzbrian/`, Wim Roach `https://www.linkedin.com/in/wim-roach-8341a785/` |

The homepage `@graph` `@id` values (`#brian-lorenz`, `#wim-roach`) are node identifiers, not URLs, and correctly stay as they are.

**Internal links are root-relative.** Every `<a>` href to an internal page uses `/resources/[slug]/`, never `https://roachlorenz.com/resources/[slug]/`. Canonical tags and every URL inside a schema block keep the absolute form. Mixed forms have twice caused an audit to undercount internal links, because the extraction filtered on `^https?:` and skipped the absolute ones.

### HowTo schema — deliberate, and not expected to produce rich results

**Do not "fix" this.** Google deprecated HowTo rich results in 2023, so the HowTo blocks on this site produce **no visible SERP treatment by design**. They are deployed for AEO — giving ChatGPT, Perplexity, Google's AI surfaces and similar systems a clean structured statement of a procedure to lift when a user asks how to do the thing. An audit (human or plugin) that reports "HowTo schema present but not generating rich results" is describing expected behavior, not a defect. Likewise, absence of HowTo on the other pages is not a gap — see below.

Ten pages carry a HowTo block:

| Page | Steps |
|---|---|
| `hud-221d4-timeline` | 9 |
| `requesting-hud-replacement-reserve-funds` | 6 |
| `how-hud-sizes-a-223f-mortgage` | 6 |
| `hud-223f-timeline` | 6 |
| `hud-survey-requirements` | 6 |
| `dscr-constrained-mortgage` | 5 |
| `hud-cash-flow-distributions` | 5 |
| `hud-apartment-loans` | 5 |
| `how-hud-sizes-a-221d4-mortgage` | 4 |
| `hud-221d4-working-capital-and-iod-escrows` | 3 |

Rules when adding or editing one:

- **Only where a real ordered procedure exists.** Comparison pieces, concept explainers, and case studies do not get one. Deliberately excluded: `hud-223a7-and-irr-loan-modification`, `hud-241a-supplemental-loan`, `hud-221d4-bspra`, `hud-interest-only-vs-amortizing`, `hud-prepayment-vs-yield-maintenance`, `hud-loan-sizing-dscr-noi-vs-appraised-value-noi`, `5-reasons-hud-deals-stall`, `montana-tax-law-hud-223f-deal-highlight`, `hud-223f-checklist`. A checklist is an `ItemList`, not a `HowTo`.
- **Every step's numbers come from the page's visible copy — never computed independently.** This is what keeps schema and body from drifting apart.
- **Every step carries a `url` anchoring to the section it was drawn from**, in the trailing-slash canonical form (`https://roachlorenz.com/resources/[slug]/#section-id`). Verify the anchor id actually exists on the page.
- The block is head-only, sits after the FAQPage block, and changes nothing visible.

### Program-number variants

Every resource page should include the unpunctuated program-number variants (223f, 221d4, 241a, 223a7) at least once naturally in visible body or FAQ text alongside the punctuated forms — these variants carry real search volume. One natural mention is enough; do not keyword-stuff.

### Canonical URL requirements

Canonical URLs for /resources/[slug] pages MUST include a trailing slash, matching the URL Netlify actually serves (e.g., https://roachlorenz.com/resources/hud-apartment-loans/). The homepage canonical is the bare domain with trailing slash (https://roachlorenz.com/). This applies to the <link rel='canonical'> tag, the og:url meta tag, and any self-referencing @id or url fields in JSON-LD schemas — all should match the trailing-slash form.

### Title tag requirements

- Keep titles **60 characters or fewer** (Google truncates in SERPs beyond this)
- Drop the "| Wim Roach & Brian Lorenz" author suffix on white papers — the domain already shows below each search result
- Keep the author suffix on the homepage title and on hub pages (`/resources/`, `/newsletter/`) — the rule exists to protect white-paper title length for program numbers and searcher vocabulary, and neither constraint applies to a hub, so an audit should not flag it there. Everywhere else, drop it.
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

## Auditing — verify the check before trusting the result

**Any CSS or markup scan must cover rules nested inside media queries and values inside JSON-LD, not just top-level selectors and `href` attributes.** A scan anchored to line-start selectors or to `href=` will silently miss both.

Five defects hid behind narrow extraction in a single session on 2026-08-24, and in every case the measurement was broken rather than the thing being measured:

| The check | What it reported | What was true |
|---|---|---|
| A `<script>`-block scan for JS touching the closing band | Matches on many pages | All were the word "closing" inside JSON-LD FAQ answer text. No JS referenced the band at all. |
| An `href=` filter for `#resources` during a site-wide repoint | Site pages clean | Three pages kept `https://roachlorenz.com/#resources` in a BreadcrumbList `"item"` value — schema, not an `href`. |
| `grep -c $'\r$'` to confirm line endings | Every line CRLF on every file | Zero CR bytes. The working tree is LF; the grep matched every line regardless. |
| A regex for the twelve design tokens in `:root` | All twelve missing on all twenty pages | Every token defined on every page. The pattern was mangled by shell escaping. |
| A selector scan for dead band CSS | All band CSS removed | `.closing` rules sat inside `@media (max-width: 600px)` on all 19 pages, and variants like `.next-steps h2` and `.end-cta-divider` sat outside the exact-match list. |

The lesson is procedural, not topical: **run the check against a case whose answer you already know before trusting its output.** A grep that reports a clean result is indistinguishable from a grep that does not work. Two of the five above reported success, and three reported a uniform result across every file — uniformity across twenty files is itself a signal that the pattern, not the corpus, is the constant.

## Mobile overflow — recurring issue

Standard fixes applied to every white paper:

- `min-width: 0` on grid children
- `overflow-x: hidden` on html and body
- `overflow-wrap: break-word` on paragraphs
- Responsive breakpoints for timeline and comparison table elements
- A mobile override on any `grid-template-columns` with a fixed px track — see below

**`overflow-x: hidden` hides this class of bug rather than preventing it.** Because it is set globally on html and body, a fixed-px grid column with no mobile override does not announce itself: the element simply extends past the viewport and is clipped, and the page still looks fine. Nothing scrolls sideways, no scrollbar appears, and `scrollWidth === clientWidth` reports clean.

**So a mobile audit must measure element widths against the viewport, not look for visible overflow.** Compare each candidate's `getBoundingClientRect().width` and `.right` to `innerWidth`; checking `document.documentElement.scrollWidth > clientWidth` will report no problem on a page that has one.

`.person .top` on the homepage sat at `grid-template-columns: 170px 1fr` at every width from launch until 2026-08-25. At 375px the team card measured **523px against a 311px content width** — clipped by 180px, invisible in every screenshot, and found only by measuring. Fixed with `@media (max-width:600px){ .person .top{grid-template-columns:1fr} }`; the threshold is 554px, where the card's 523px min-content floor plus the wrap's 32px padding exceeds the viewport.

## Event handler binding — never inline

Event handlers must be bound with `addEventListener` in a script block. Never use inline `onsubmit`/`onclick` attributes. Netlify's HTML minifier rewrites double-quoted attributes to single quotes and backslash-escapes inner quotes, which HTML attributes do not support — an inline handler with a quoted string argument fails to compile in production while working correctly in local preview. This silently broke the inline FHA comparison form from May to August 2026. When binding, select the live form by class rather than name, since Netlify detection stubs share the form name. Use `event.currentTarget`, not `event.target`, inside handlers.

### Form architecture

**Two Netlify forms, not one.** `quarterly-subscribe` takes every newsletter signup site-wide. `fha-comparison-inline` is separate and lives only on `hud-223a7-and-irr-loan-modification`, which therefore carries four `<form>` elements — a live form and a detection stub for each. Do not assume every subscribe-shaped form posts to `quarterly-subscribe`.

`quarterly-subscribe` appears on **23 deployed pages**, each with one live form and one hidden detection stub sharing the name. A 24th copy lives in `quarterly-card-component.html`, which is gitignored and not deployed — exclude it from any count.

Signups are told apart by a hidden `source-location` input, five values:

| Value | Where |
|---|---|
| `article-end` | The author + Quarterly card, on 20 pages — the 19 resource papers and `newsletter/2026-q2` |
| `resources-index` | `/resources/` |
| `newsletter-index` | `/newsletter/` |
| `homepage` | `/` — the `.nlsub` strip above the contact band |
| `inline-after-hybrid` | The FHA comparison form on `hud-223a7-and-irr-loan-modification`, which posts to `fha-comparison-inline` |

The value appears twice per page — once in the hidden input and once in the `gtag('event', 'quarterly_subscribe', …)` call. Change both together. The homepage also carries an unrelated Netlify form named `contact`; it coexists with `quarterly-subscribe` without collision because the two have different `name` and `form-name` values.

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
8. Add at least one in-body contextual inbound link to the new page from an existing page — inside a sentence that already discusses the topic, not a related-articles block. Prefer a high-traffic source page. Pages discovered only through `sitemap.xml` tend to sit in "Crawled — currently not indexed": `hud-cash-flow-distributions` published 2026-07-31 and was still unindexed on 2026-08-19 with sitemap-only discovery
9. Wire the page into the library — this is five edits, not one: add it to the correct stage group in `resources/index.html`, bump `numberOfItems` **and** extend `itemListElement` in that page's ItemList schema, update the hardcoded count in the homepage's `.browse-all` link (the JS that derived it was deleted with §7, so nothing counts it now), and add it to the continued-reading mapping on the pages where it is a genuine next read
10. Update `sitemap.xml` with the new URL
11. Push all updated files to GitHub
12. Google Search Console → URL Inspection → paste new URL → Request Indexing
13. After deploy, test the social preview at linkedin.com/post-inspector

## Workflow split

- **Claude project chat (claude.ai)** = iterative page building and white paper drafting. Back-and-forth content work.
- **Claude Code (this environment)** = cross-site operations: wiring new pages into index, auditing SEO tags across all files, applying global updates, git operations, deployment prep.

## Where published content lives

The `/resources/` folder is the source of truth for what's published. Each subfolder contains one white paper or article as `index.html`. To see what exists, look there directly rather than relying on a list in this file.

The **241(a) Supplemental Loan white paper** (`resources/hud-241a-supplemental-loan/index.html`) is the canonical style reference — match its voice and structure for any new long-form content.

## Change log

- **2026-08-24:** Built the resources index and the continued-reading block, and retired the generic closing band. `ecaf748` replaced inconsistent per-element `scroll-margin-top` with one `html { scroll-padding-top: 86px }` on all 21 pages carrying in-page anchors, matching the sidebar's existing `top: 86px` so an anchored section aligns with the sidebar card, plus a 100px override below 480px where the nav CTA wraps to two lines and the header grows to ~95px. `06b69f5` published `/resources/` — all 19 papers grouped by stage, with ItemList schema and the lighter subscribe strip. `e408c66` deleted the homepage's `§7 THE LIBRARY`, now duplicated by that index, expanded `§2` to six cards with a 2-column tablet state, added a stage-link row, and repointed every `/#resources` reference site-wide — nav, footer, five closing-band buttons, one in-body link, and three BreadcrumbList nodes; the load-more JS it removed contained an unguarded `loadBtn.textContent` that would have thrown once the markup was gone, taking the comparison toggle, the GSAP timeline, and the deep-link re-anchor script with it. `530fc43` moved three passages of underwriting substance out of closing bands into article bodies before `cdf3450` deleted the bands themselves and replaced them with Continue Reading blocks. Two audit rules came out of the session: the below-article component rules above, and "Auditing — verify the check before trusting the result," written because five separate defects hid behind extraction patterns that did not work.
- **2026-08-21:** Rolled the author + Quarterly subscribe card out to all 20 resource pages and the newsletter issues, moved the card and closing band out of the article column on the 17 standard pages, and converted the Quarterly form from an inline `onsubmit` to `addEventListener` site-wide. Two failure modes were diagnosed and are now written up as rules: the Netlify minifier corrupting inline handler attributes (see "Event handler binding — never inline"), which had silently broken the inline FHA form since May 2026; and the sticky-sidebar containing block (see "Nothing below the article goes inside the layout grid"), which made the sidebar on `hud-223f-checklist` paint over the card by 444px. That page also had its sidebar capped to the viewport, matching `.doc-sidebar`. Both were fixed by structure, not by patching symptoms — the earlier height cap and `grid-column` span each looked like fixes and were not.
- **2026-08-19:** Schema cleanup across the site. Reconciled the prepayment paper's FAQ, where the FAQPage block and the visible FAQ had drifted into two different six-question sets sharing only one question — now one set of nine, identical in both places. Removed duplicate microdata Article schema from 8 pages, including a duplicate microdata FAQPage on `hud-223f-timeline`; every page now carries exactly one Article entity, in JSON-LD. Normalized author `url` and `sameAs` across all 20 authored pages, replacing three inconsistent conventions and two dead `#brian-lorenz`/`#wim-roach` anchors. Added the "Schema integrity and internal link form" section above and the inbound-link step to the deployment checklist, so each of these is a rule an audit can enforce rather than something rediscovered later.
- **2026-08-07:** Published the DSCR-constrained mortgage white paper (`resources/dscr-constrained-mortgage/`, with an interactive DSCR calculator) and extended HowTo schema from 3 pages to 10. Added the "HowTo schema — deliberate, and not expected to produce rich results" section above, because Google deprecated HowTo rich results in 2023 and a future audit would otherwise flag the absence of rich results as a defect. The blocks exist for AEO only. That section also records which pages are deliberately excluded, so their absence isn't flagged as a gap either.
- **2026-07-31:** Documented the canonical page-layout template (`.doc-layout`/`.doc-sidebar`/`.section-block`) and flagged the `hud-interest-only-vs-amortizing` `.container`/`.layout`/`.sticky` layout as a deprecated do-not-copy exception. Also patched that page's `.sticky` sidebar to add the `max-height`/`overflow-y: auto` scroll containment (desktop-scoped; reset to static on mobile) — it was the last page still exhibiting the sidebar-overlap bug because it predates the `.doc-sidebar` fix.
- **2026-07-13:** Standardized site headers. Interior pages (papers + newsletter) now share one header: wordmark + right-justified Resources/Quarterly/Team links + Get in Touch button, replacing the old wordmark + "← All Resources" back-link pattern. Homepage keeps its section-anchor nav but adopts the mono-uppercase link treatment, and its CTA became the Get in Touch button. Also fixed `/#section` deep links from interior pages (GSAP pin-spacer shifted anchor targets after the initial jump; homepage now re-anchors post-load and sections have scroll-margin-top).
- **2026-06-17:** Updated canonical URL standard for /resources/ pages from no-trailing-slash to with-trailing-slash. Reason: Netlify 301-redirects non-trailing URLs to trailing-slash form (because index.html lives inside directories), which created a canonical conflict — sitemap and canonical tags pointed to URLs that were themselves 301 redirects. Pages began falling into 'Crawled — currently not indexed' status. Fix aligned all canonicals and sitemap entries to the trailing-slash form the server actually serves.
