# Centennial Sizing — Publishing Pipeline

This is the server-side core of the publishing pipeline (handoff Section 6, item 1):
the part that turns an Excel **HTML Export** paste into a finished, borrower-facing
sizing page plus a ready-to-send email snippet. It runs and is fully tested. The
remaining piece — wiring it to Netlify + GitHub storage at a real subdomain — is
deliberately left for deploy time, because it needs your account inputs (below).

## What's here

```
lib/
  parser.js            Node port of publisher.html's parser. Same SCHEMA, same
                       logic — Excel paste in, normalized deal object out. Adds
                       isValid() and slugify().
  chassis-template.html The borrower page, made fully data-driven. (See "the fix.")
  render.js            Injects a parsed deal into the chassis -> finished page.
                       Supports --preview watermark and --stale banner flags.
  terms.js             Reads the headline numbers (loan, rate, DSCR, term) back
                       out of the *rendered page's own math* — so the email can
                       never disagree with the page.
  email.js             Minimal email snippet: just the headline numbers table
                       and the live-sizing link button. No header, greeting,
                       intro, signature, or disclaimer — you write the email
                       around it in Outlook. Built for New Outlook.
test/
  verify-arc.js        End-to-end proof the Arc deal reproduces to the dollar.
  verify-sonoran.js    Proof a *different* deal binds correctly (the fix).
  render-cli.js        Command-line driver (see below).
  *-paste.txt          The two test deals' Export-tab pastes.
samples/               Four rendered files you can open in a browser right now.
```

## The fix (why a second test deal exists)

The original chassis only data-bound the *computed* cells. Every input-derived
cell — line items, fees, MIP, term, the editable seed values — was hardcoded to
Arc's numbers. For Arc that looked perfect, because the hardcoded values happened
to be Arc's real values. For **any other deal**, the page would have shown Arc's
line items next to a different deal's totals.

`chassis-template.html` now binds every one of those cells to the delivered data.
`verify-sonoran.js` publishes a deal whose line items differ from Arc on exactly
those cells and confirms the page shows the new deal's numbers, not Arc's.

## Run it

```
npm install          # jsdom only
npm test             # both deals, end to end

# Render a page from an Export-tab paste:
node test/render-cli.js test/sonoran-paste.txt \
  --out out.html --preview --stale \
  --url "https://.../sonoran-vista-apartments-phoenix-az" \
  --sender wim --to "Maria" --email email.html
```

## Open the samples

- `samples/arc-apartment-homes.html` — clean published page (Arc, to the dollar).
- `samples/sonoran-vista-PREVIEW-STALE.html` — a different Affordable deal with the
  internal-preview watermark and the stale-pricing banner both on.
- `samples/arc-email-snippet.html`, `samples/sonoran-email-snippet.html` — the
  email snippets: just the numbers table and the link button. Open in a browser
  to preview; the rendered content is what you paste into a message you've
  written and signed yourself in Outlook.

## What's NOT built yet — needs your inputs at deploy time

The architecture is already decided in the handoff (Netlify static hosting +
Netlify Functions + JSON committed to a GitHub repo). What remains is the glue,
and it can't be finished from here because it needs:

1. **GitHub repo** — name/owner of the repo that will hold the published JSON +
   pre-rendered HTML, and a token with commit access.
2. **Netlify site** — the site these functions deploy to, and Netlify Identity
   turned on (gated to you + Wim).
3. **Subdomain** — `sizings.centennialmortgage.com` vs `sizings.roachlorenz.com`.
   This is the one item the handoff flags as yours to confirm.

Once those exist, the remaining functions (publish orchestration, storage,
supersession redirects, the 30-day soft-expiry cron, and the Identity gate) drop
in against this core without changing any of the parsing/rendering logic.
