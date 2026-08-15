# West Midlands Startup Map

An independent, human-checked gallery and directory of startups across Birmingham,
Solihull, Coventry, Warwickshire and the Black Country. The gallery is the front door;
the map, jobs board and funding feed sit behind it.

The **visual direction follows [startups.gallery](https://startups.gallery)**: near-white
page, centred pill nav, one headline, a funding ticker, and a wall of large brand tiles
with the name, one line and `Sector · Stage · Based in place` beneath. The data model,
components and copy rules came from the **West Midlands Startup Map Design System**
handoff; its ink-and-paper editorial styling was replaced (see *Design direction* below).

## Run it

```bash
npm install && npx prisma migrate dev && npm run dev
```

Then open http://localhost:3000. `migrate dev` creates `dev.db` and seeds it.

| Script | What |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Production build (prerenders every company page) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:seed` | Re-seed without dropping the schema |
| `npm run db:reset` | Drop, migrate and re-seed |
| `npm run icons` | Recompile `assets/icons/*.svg` into `lib/icons.generated.ts` |
| `npm run import:ch -- <csv>` | Stream the Companies House bulk file into the candidate queue |
| `npm run lint:brand` | Check the codebase against the Datum Labs brand book |

## Surfaces

| Route | Screen |
| --- | --- |
| `/` | The gallery — headline, funding ticker, brand-tile wall, floating filter sheet |
| `/map` | The map — icon rail, filter chips, 380px result panel, live Leaflet map |
| `/company/[slug]` | Company profile — full-width tile, figures, roles, funding, intro request |
| `/jobs` | Regional jobs board — filter rail, disciplines, salary floor, weekly digest |
| `/funding` | Funding, events, perks and spaces feeds, plus the regional figures |
| `/news` | Editorial — index, article pages, tag pages, RSS |
| `/newsletter` | The weekly digest, with topics and double opt-in |
| `/add` | Add your startup — three steps, one form, queued for review |
| `/method` | How every number is counted, and what the map does not know |
| `/admin` | Review queue, article editor, outbox, subscribers |

The five nav items — Explore / Map / Jobs / Funding / News — sit in a centred pill, as
the reference does it.

### Pages built to be found

Generated from the data, each with a real heading, a paragraph of computed numbers,
sideways links to its siblings and `ItemList` JSON-LD. Hubs with fewer than two companies
are never generated — a thin page is worse than no page.

| Pattern | Example | Count today |
| --- | --- | --- |
| `/startups/[sector]` | `/startups/fintech` | 6 |
| `/startups/in/[place]` | `/startups/in/birmingham` | 5 |
| `/startups/stage/[stage]` | `/startups/stage/seed` | 4 |
| `/investors/[slug]` | `/investors/midven` | 20 |
| `/news/tag/[slug]` | `/news/tag/funding` | 7 |

That is 42 landing pages from 39 companies, and every one grows on its own as listings
are added.

## The map

Three layers, all plotted: **companies** (teardrop, sector hue, clustered below zoom 12),
**events** (rounded square, calendar glyph) and **spaces** (rounded square, building
glyph). The left rail switches layers rather than navigating away, and doubles as the key.
Layer state, filters and selection all live in the URL.

## Email

Nothing sends directly. Every message is rendered, written to an `EmailMessage` outbox row,
and only then handed to a provider — so the whole product works with no credentials at all
and you can read exactly what would have gone out in `/admin/outbox`.

- **Provider** is chosen by `EMAIL_PROVIDER`: `outbox` (queue only, the default), `console`
  (queue and log), or `onchainsuite`.
- **The OnchainSuite adapter in `lib/email/provider.ts` is a placeholder.** The endpoint,
  auth header and body shape are guesses. Wiring the real API means editing that one
  function — nothing else in the app touches a provider.
- **Newsletter is double opt-in.** A `pending` subscriber is never sent anything but the
  single confirmation. Confirm and unsubscribe are token links; `List-Unsubscribe` headers
  go on everything bulk.
- **Transactional flows**: claim verification (the link is what actually grants the claim
  and marks the listing verified), submission received / approved / rejected, intro request
  plus acknowledgement.
- **The digest** (`lib/digest.ts`) builds the last seven days of raises, listings, roles and
  articles, filters by each subscriber's topics, and **skips anyone with nothing new**
  rather than sending an empty email. Run it from `/api/cron/digest` — guarded by
  `CRON_SECRET`, and it refuses to run if that is unset.
- **Abuse controls**: database-backed rate limits on every public write, plus a honeypot
  field on each form.

## Growth machinery

Five things that exist to make the directory compound rather than sit still.

**Real logos.** `Company.logoUrl` wins over the generated tile everywhere. `lib/logos.ts`
reads a company's own site for an apple-touch-icon and stores the URL — we never rehost
anyone's mark, and anything under 64px is ignored because a browser favicon looks like
grit on a gallery tile. Set one by hand in `/admin/companies`; that always beats discovery.

**The careers-page embed.** Two lines a listed company drops on its own site:

```html
<div data-wmsm-jobs data-company="your-slug"></div>
<script src="https://…/embed/jobs.js" async></script>
```

Deliberately *not* an iframe — the script writes real anchors into the host page, so the
roles are readable by anything that reads the page, and every install is a genuine backlink.
No dependencies, no tracking, scoped under one class prefix, and a failed fetch leaves the
host page untouched. `/api/embed/jobs` serves the JSON, CORS-open and cached. The snippet is
offered on each company's own profile.

**Company changelogs.** `CompanySnapshot` records roles, headcount and raised each night.
Profiles then say what *moved* — "+3 roles · £22M raised in the last 30 days" — and go quiet
rather than showing a row of zeroes when nothing has.

**Auto-drafted funding posts.** `lib/autodraft.ts` turns a round into a **draft**, never a
published post: who, how much, which investors, plus real context it pulls from the
database (which round this is, total raised, sector peers, open roles) and an explicit
`## TO WRITE` section for the part only a person can write. Idempotent — one draft per
round, ever.

**Geocoding.** `lib/geocode.ts` resolves postcodes through postcodes.io — free, no key.
Approval now writes a correct pin, locality and authority immediately. A postcode that
resolves outside the region is rejected rather than plotted. The nightly backfill only ever
touches rows that have never been resolved, so the hand-checked seed points are safe.

All of it also runs from `/api/cron/daily` (see `vercel.json`), and every job is safe to
repeat.

## The map

**Leaflet** rendering **CARTO "light_all"** raster tiles, built from **OpenStreetMap** data.
Not Google — no key, no billing, no quota, and no per-load cost. Attribution to OSM and
CARTO is required and is in the corner.

Company markers show the company's **own logo** when we hold one, in a white chip ringed in
its sector colour so the legend still reads. No logo falls back to the sector teardrop, and
a logo URL that 404s falls back too — `LiveMap` listens for image errors in the capture
phase, because image errors do not bubble.

Swapping basemaps is a one-line change in `LiveMap.tsx`. CARTO's free tier is for
reasonable non-commercial use; at volume, Protomaps self-hosted or MapTiler are the usual
next steps.

## Finding real companies

There is no list of West Midlands startups. There is one authoritative register and a
lot of filtering, so the pipeline is three importers feeding one review queue at
`/admin/candidates`. **Nothing an importer finds is ever public** — a candidate becomes a
listing only when a person accepts it, which is the same promise the rest of the site makes.

### 1. Paste a list — highest precision, start here

Investor portfolios (Midven, MEIF, Mercia, Minerva), accelerator cohorts, Silicon Canal's
directory, Alpha Works and Innovation Birmingham tenants, university commercialisation arms,
TIGA members for Silicon Spa. One company per line, commas/tabs/pipes:

```
Kanda Robotics, kandarobotics.co.uk, B11 2AA, Midven portfolio
```

Reading those pages and pasting beats automating them, and the result is far cleaner.

### 2. UKRI Gateway to Research — best signal, one button

[gtr.ukri.org](https://gtr.ukri.org/) — free, no key, no registration, covers Innovate UK
and all seven research councils. Someone assessed these companies and gave them money for
research, which is the strongest cheap evidence that a company is real and operating.
Organisations arrive with a company number, website, postcode and their funded projects.

Two API quirks, both found the hard way: the versioned `Accept` headers in the older docs
return 406, and page size must be at least 10.

### 3. Companies House — widest net, command line

The [free company data product](https://download.companieshouse.gov.uk/en_output.html):
~5M live companies, monthly, ~400MB zipped / 2GB open. Too big for a request, so it streams
from a script:

```bash
curl -O https://download.companieshouse.gov.uk/BasicCompanyDataAsOneFile-2026-08-01.zip
unzip BasicCompanyDataAsOneFile-2026-08-01.zip
npm run import:ch -- BasicCompanyDataAsOneFile-2026-08-01.csv --since 2010
```

Filtered to postcode areas **B, CV, DY, WS, WV**, active companies, and tech SIC codes
(`lib/sic.ts`). Real run: **5,695,466 rows scanned in ~5 minutes → 13,241 candidates.**

`lib/sic.ts` splits SIC into two tiers, and the split was learned the hard way. A first pass
allowed anything that looked adjacent to technology and produced **32,766** candidates whose
top scorers were a nursing home, an electrician, a mortgage broker and a clothing retailer
that had filed a design code. **CORE** codes are what a technology business actually files —
a candidate must have at least one. **SUPPORTING** codes can decide which sector it lands in
but never get it into the queue alone. Scoring also rewards a core code in *first* position:
technology filed first is the business, filed fourth is a sideline.

Two caveats remain and always will: SIC is self-declared, and the registered address is
frequently the accountant's office. This produces candidates, not listings.

Check the licence on the download page before republishing anything derived from it.

### Enrichment: the part that removes the manual work

Neither Companies House nor Gateway to Research publishes a **website**, which leaves the
single most useful field empty on every imported candidate. `lib/sources/enrich.ts` closes
that:

1. **Guess the domain** from the company name — strip the legal suffix, try `.co.uk`,
   `.com`, `.io`, `.uk`. Crucially, a hit only counts if the page **mentions the company**;
   without that check almost every guess finds a parked domain.
2. **Read the site** for its `og:description`, meta description, or title, tidied to house
   style. The reviewer edits a line instead of writing one.
3. **Record whether the site responded at all** — a dead site is the strongest cheap signal
   that a Companies House row is a shell.

Measured on the first 60: **29 websites found, 28 reachable, 22 with a usable description.**
Runs from `/admin/candidates` and nightly from the cron.

### Scoring

`lib/candidates.ts` scores 0–100 from what a machine can check — has a website, SIC maps to
one of the six sectors, incorporated 1–15 years ago, has public R&D funding, name does not
read like a consultancy. It **orders the queue and decides nothing**. On the sample above,
three real-looking companies scored 65–70 and `J SMITH IT CONSULTING LIMITED` scored 0 with
its reasons printed.

Accepting resolves the postcode, looks for a logo, publishes, and leaves the listing
**unverified** — a person clicked accept, which is not the same as having checked the company.

### Do not scrape LinkedIn or Crunchbase

Against their terms, and it would undercut the one thing this site sells.

### The seed is fictional and stays out of production

`prisma/seed.ts` refuses to run when `NODE_ENV=production` (override with
`ALLOW_FICTIONAL_SEED=yes` if you really mean it). It exists so local development is never
empty. Production starts empty and fills from the importers.

## Admin

`/admin`, behind a single `ADMIN_TOKEN` hashed into an httpOnly cookie. Without the token
set, admin refuses to open at all — the correct default for something that can publish.

Review queue (approve a submission and it is geocoded, logo-checked, published and emailed;
reject with a reason and they are told why), a companies table for logo and location
overrides, a markdown article editor with scheduling and tags, the outbox with retry, and
the subscriber list. Every nightly job also has a button.

## Architecture

- **Next.js 16 (App Router), React 19, TypeScript.** Server components by default;
  `use client` only where there is state — the explorer, the jobs filters, dialogs, tabs.
- **Prisma 7 + SQLite** via the `better-sqlite3` driver adapter. Swap the provider in
  `prisma/schema.prisma` and the `DATABASE_URL` for Postgres; nothing else changes.
- **Server actions** (`app/actions.ts`) handle every write: submissions, claims, intro
  requests, digest signups. All validated server-side; none of them publish anything.
- **Leaflet + CARTO light basemap**, keyless, loaded client-side only. Pins carry the
  sector hue; below zoom 12 nearby ones merge into a count.
- **ISR at one hour** on the data routes, so an approved listing appears the same morning.

```
app/
  (site)/          gallery + directory pages, share TopBar / SiteFooter
  map/             the app frame — no site chrome, 100dvh, fixed panels
  tokens/          token files — same names as the handoff, new values
  globals.css      base layer + additions (skip link, scroll, Leaflet, responsive frame)
  ds.css           component styles — hover/press states as CSS, not React state
  actions.ts       server actions
components/
  ds/              the 23 design-system components, typed
  gallery/         BrandTile, GalleryCard, FundingTicker, Gallery (filters + paging)
  map/             LiveMap (Leaflet), MapExplorer
  app/  site/  company/
lib/
  queries.ts       every read; all figures computed here
  format.ts        £, dates, counts, in house style
  icons.generated.ts  52 Lucide glyphs, inlined at build time
```

## Brand: Datum Labs

The product carries the **Datum Labs** identity, from *Datum Labs — Brand Expansion (2026)*.
Because a brand book is a PDF, and the only thing enforcing a PDF is whoever last read it,
the mechanical parts of it are a linter:

```bash
npm run lint:brand          # report
npm run lint:brand -- --ci  # exit 1 on any error
```

It runs as `prebuild`, so **a build fails if the app drifts off brand**. Rules live in
`brand/datum-labs.json` — change them there, never in the linter. Four checks:

| Rule | Severity | What it catches |
| --- | --- | --- |
| `colour` | error | Any hex outside the palette. Alpha over a brand colour is fine — it compares RGB channels, so `rgba(3,7,45,.09)` passes and `rgba(16,24,40,.09)` does not. |
| `font` | error | Any typeface that is not Source Serif 4, Geist or Geist Mono. Generic fallbacks are ignored. |
| `gradient` | warn | A gradient built from raw colour rather than tokens, which would survive a palette change. |
| `rgb` | warn | Raw channels that are not a brand colour. |

`app/tokens/*.css` and `app/globals.css` are where raw values are allowed to be born;
everywhere else must go through a token. Baseline when first run against this codebase:
**20 errors, 37 warnings**. Now zero.

### Co-branding

The footer states the relationship plainly — "Built and maintained by Datum Labs" with the
mark — rather than burying it. The map's pitch is independence, so the reader is owed the
connection up front rather than discovering it later.

### The palette

Five brand colours, exact: Electric Sapphire `#4A6CF7` (the action colour), Platinum
`#F5F7FA` (page ground), Prussian Blue `#03072D` (ink and inverse surfaces), Navy
`#000B78`, Onyx. The ink and paper ramps are stepped from Prussian Blue and Platinum,
declared in `derived` so the linter knows them.

**Two documented exemptions**, both things the brand book does not address and a directory
cannot work without:

- **`dataPalette`** — the six sector hues. A categorical encoding scale, the way a chart
  palette sits outside a brand palette. They drive every gallery tile; without them the
  wall is monochrome and sectors stop being scannable. Brand colours still govern all
  chrome.
- **`statusPalette`** — success, warning, danger. Deliberately desaturated so they sit
  under the blue rather than fight it.

Anything outside those three sets is an error.

### Texture, noise and gradient

The book's gradient recipe is a brandmark silhouette with noise, texture and blur layered
on. Those are Figma effects, so `app/tokens/brand.css` holds their CSS equivalents,
generated once and inlined as data URIs — no assets, no network request:

- `--brand-texture` — the book's dashed intersecting lines, tiled at 120px
- `--brand-noise` — an `feTurbulence` field standing in for the noise layer
- `.wm-texture` / `.wm-noise` / `.wm-brand-surface` — apply them, in that order

The gallery tiles carry the full recipe, which is the largest brand surface on the site.
The light "paper" tile is deliberately left clean: texture over near-white reads as dirt
rather than depth. Both layers disappear under `prefers-reduced-transparency`.

### Typography

The brand book's three roles, exactly: **Source Serif 4** for headings ("quiet authority"),
**Geist** for body, **Geist Mono** for labels, captions and eyebrows. All three come from
`next/font/google`, so no font files are needed. The mono eyebrow that the previous
direction removed is back, because the brand book asks for it.

## Design direction

The first build followed the handoff literally: ink type on warm map paper, copper
accents, Archivo + Instrument Sans + IBM Plex Mono, mono eyebrow labels, map-first. That
was rejected in favour of the startups.gallery aesthetic, so:

- **Tokens were revalued, not renamed.** `app/tokens/*.css` still exposes the same
  variable names, which is why all 23 components survived the reskin untouched. Page is
  now `#F9FAFB`, cards white, type near-black, and blue is the only action colour.
- **Inter throughout.** The three-family stack and every mono eyebrow went with it.
- **Pills everywhere.** `--radius-control` is `999px`; nav, buttons, chips and fields are
  all pill-shaped, and borders gave way to very light shadow.
- **The six sector hues survived**, because the brand tiles are built from them. They are
  the only saturated colour on the page.
- **Brand tiles replace monograms** as the primary visual — see `components/gallery/BrandTile.tsx`.
  Four treatments (gradient wash, giant letterform, light card, ink card) picked by a hash
  of the slug, so a company's tile is varied across the wall but stable across visits.
  Pass `logoUrl` and the generated tile steps aside.
- **Filters moved into a floating sheet** behind a docked "Filter" pill, and the state
  lives in the URL, so a filtered wall is a link you can send.
- **`/board` became `/funding`.** The nav needed a name that says what the tab holds.

## Where this departs from the handoff

Each of these is a decision, not a slip — reverse any of them if you disagree.

0. **The visual system.** The largest departure, covered above and requested explicitly.
1. **Icons are inlined at build time.** The kit's `Icon` fetched each SVG at runtime,
   which cannot work in a server component and flashes on first paint.
   `scripts/build-icons.ts` compiles `assets/icons/` into a module instead. Same glyphs,
   same 1.75 stroke, same `currentColor`.
2. **Hover and press moved from React state to CSS** (`app/ds.css`), so `Button`, `Card`,
   `ListingRow` and friends render as server components. Identical token values.
3. **Fonts are self-hosted by `next/font`** rather than a Google Fonts `@import`, so they
   do not block render. Now Inter alone.
4. **The CSV export is real and not gated.** The kit showed a "Pro" badge on it. Nothing
   else in this product charges, and an open directory that paywalls its own export is a
   different product — so it downloads the filtered view. Put the gate back if the
   business model needs it.
5. **The profile has no tabs.** Every section stays in the document, stacked; hiding
   two-thirds of a directory page behind a tab hides it from search too.
6. **No "Team" tab.** There is no people data, and the house rule is to say what is
   unknown rather than fill it.
7. **Every number is computed from the database.** The kit's mockups showed 1,482
   companies and £412M; this app prints what is actually in the table — today 39 and £86M.
   `/method` defines each figure. If the hero should show an aspiration instead of a
   count, that is a copy decision, not a data one.
8. **Saved listings live in `localStorage`.** No account, nothing to leak.

## Data

`prisma/seed.ts` holds 39 companies, 43 rounds and 43 roles across the six sectors.

**The geography is real** — every lat/lng is the place named, from Tyseley to Stourbridge
to Silicon Spa. **The companies are not.** Names, raises, salaries and investors are
invented placeholders shaped like regional data. The seed refuses to run in production for
exactly this reason; real listings come from the importers above.

## Still open

- **Brandmark.** The Datum "D" is in the brand book but no SVG was supplied, so
  `components/Wordmark.tsx` is still a lettered square. Drop the real mark in and only that
  file changes.
- **Onyx.** The brand book prints Onyx as `#000B78` — identical to Navy — which is a copy
  error, since the swatch is clearly near-black. `#141414` is standing in, flagged as
  `$unverified` in `brand/datum-labs.json`.
- **Texture, gradient and dither.** The book specifies a dashed-line texture at soft-light,
  a noise/texture/blur gradient recipe, and a custom dither for imagery. Only the flat
  gradient equivalent is implemented (`--gradient-brand`); the texture tile and dither are
  Figma effects with no assets supplied.
- **Company imagery.** Logo discovery only finds marks a company already publishes, and the
  seeded domains are fictional so almost nothing resolves. Real listings will do better;
  product screenshots would do better still and there is no upload pipeline yet.
- **The OnchainSuite API contract.** Everything else in the email stack is finished and
  tested; only the transport is stubbed. Send the endpoint, auth and body shape and it is a
  ten-minute change.
- **Sending domain.** Before any real send: SPF, DKIM and DMARC on the sending domain, and
  a warm-up. The `List-Unsubscribe` headers and text parts are already in place.
- **Owner editing.** Claiming marks a listing verified but there is still no owner login, so
  changes go through us.
- **Bounce handling.** `Subscriber.status` has a `bounced` state and nothing sets it yet —
  that needs the provider's webhook.
