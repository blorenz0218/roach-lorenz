# roachlorenz.com

Personal brand site for Brian Lorenz and Wim Roach, both VPs of Originations at Centennial Mortgage, Inc. Target audience is HUD/FHA multifamily mortgage prospects — property owners, developers, syndicators, and property management companies. Primary geography is Pacific Northwest and Mountain West with national reach. Goals are SEO/AEO visibility, trust-building for cold-call prospects, white paper distribution, and inbound lead generation. The brand operates independently of any specific lender.

## Who we are

- **Brian Lorenz** — VP, Originations. Former Senior HUD Underwriter at Colliers Mortgage with a 100% HUD Firm Commitment success rate (never had a deal rejected). Lives in Boise, ID.
- **Wim Roach** — VP, Originations. Extensive borrower relationships and closed transaction volume.

## Loan programs featured

Primary: **223(f)** (refinance/acquisition of stabilized multifamily), **221(d)(4)** (new construction/substantial rehab).
Secondary: 241(a) supplemental loans, 223(a)(7) refinance, BSPRA structuring.

## Hosting and deployment

- **Repo:** GitHub
- **Deploy:** Netlify auto-deploy on push to main
- **Analytics:** Google Analytics 4, measurement ID `G-H3Y2SPVQSK`
- **Search:** Google Search Console configured

## Design system

- Navy and gold palette
- Headings: Playfair Display (serif)
- Body: DM Sans
- Apply consistently across all pages and white papers

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

### Title tag requirements

- Keep titles **60 characters or fewer** (Google truncates in SERPs beyond this)
- Drop the "| Wim Roach & Brian Lorenz" author suffix on white papers — the domain already shows below each search result
- Keep the author suffix only on the homepage title
- Lead with the specific HUD program number when applicable (e.g., "HUD 241(a)...", "HUD 221(d)(4)...") — these are the primary search terms

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
5. Confirm canonical URL matches the site pattern: `https://roachlorenz.com/resources/[folder-name]` with no trailing slash and no `.html` extension
6. Confirm the hero entrance animation (fadeUp cascade on `.cover-series`, h1, `.cover-lede`, `.cover-meta`) is present in the page's `<style>` block
7. Update `sitemap.xml` with the new URL
8. Push all updated files to GitHub
9. Google Search Console → URL Inspection → paste new URL → Request Indexing
10. After deploy, test the social preview at linkedin.com/post-inspector

## Workflow split

- **Claude project chat (claude.ai)** = iterative page building and white paper drafting. Back-and-forth content work.
- **Claude Code (this environment)** = cross-site operations: wiring new pages into index, auditing SEO tags across all files, applying global updates, git operations, deployment prep.

## Where published content lives

The `/resources/` folder is the source of truth for what's published. Each subfolder contains one white paper or article as `index.html`. To see what exists, look there directly rather than relying on a list in this file.

The **241(a) Supplemental Loan white paper** (`resources/hud-241a-supplemental-loan/index.html`) is the canonical style reference — match its voice and structure for any new long-form content.
