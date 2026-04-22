# roachlorenz.com

Personal brand site for Brian Lorenz and Wim Roach, both Vice Presidents at Centennial Mortgage, Inc. Target audience is HUD/FHA multifamily mortgage prospects — property owners, developers, syndicators, and property management companies. Primary geography is Pacific Northwest and Mountain West with national reach. Goals are SEO/AEO visibility, trust-building for cold-call prospects, white paper distribution, and inbound lead generation. The brand operates independently of any specific lender.

## Who we are

- **Brian Lorenz** — Vice President. Former Senior HUD Underwriter at Colliers Mortgage with a 100% HUD Firm Commitment success rate (never had a deal rejected). Lives in Boise, ID.
- **Wim Roach** — Vice President. Extensive borrower relationships and closed transaction volume.

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
2. Update `sitemap.xml` with the new URL
3. Push all updated files to GitHub
4. Google Search Console → URL Inspection → paste new URL → Request Indexing

## Workflow split

- **Claude project chat (claude.ai)** = iterative page building and white paper drafting. Back-and-forth content work.
- **Claude Code (this environment)** = cross-site operations: wiring new pages into index, auditing SEO tags across all files, applying global updates, git operations, deployment prep.

## Where published content lives

The `/resources/` folder is the source of truth for what's published. Each subfolder contains one white paper or article as `index.html`. To see what exists, look there directly rather than relying on a list in this file.

The **241(a) Supplemental Loan white paper** (`resources/hud-241a-supplemental-loan/index.html`) is the canonical style reference — match its voice and structure for any new long-form content.
