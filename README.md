# Kernbau — building materials discovery

A prototype for finding and justifying a construction product by its **declared
performance**, built for the Knauf Digital take-home assignment.

Kernbau is a fictional manufacturer of insulation, reinforcement and render
systems. Every declared value in the catalogue is invented; the framework around
it — units, harmonised standards, Euroclasses, Declaration of Performance
numbers — follows what a real datasheet uses. See [Data](#data) for what that
means and what it does not.

```
docker compose up          # → http://localhost:3000
```

One command from a clean clone to a running app and a seeded database. No
accounts, no API keys, no external services.

---

## Contents

- [Running it](#running-it)
- [What I found out first](#what-i-found-out-first)
- [What the application does](#what-the-application-does)
- [Scope](#scope)
- [Architecture](#architecture)
- [The required states](#the-required-states)
- [Data](#data)
- [Design](#design)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Limitations and next steps](#limitations-and-next-steps)
- [Repository map](#repository-map)

---

## Running it

### With Docker (the intended path)

```bash
docker compose up
```

Postgres starts, the app container waits for it to be healthy, rebuilds the
schema, loads the catalogue and serves on **http://localhost:3000**.

If port 3000 is already taken:

```bash
APP_PORT=3001 docker compose up
```

Postgres is published on host port **55432**, not 5432, so it cannot collide
with a Postgres you already run.

### Without Docker

Node 22+ and a Postgres you can reach.

```bash
docker compose up -d db                 # or use your own Postgres
cp .env.example .env
npm install
npm run db:setup                        # schema + catalogue
npm run dev                             # → http://localhost:3000
```

### Other commands

| Command                      | What it does                                               |
| ---------------------------- | ---------------------------------------------------------- |
| `npm run catalogue:generate` | Rebuilds `data/catalogue.json` from the family definitions |
| `npm run db:setup`           | Drops, recreates and reseeds the database                  |
| `npm run media:optimise`     | Re-encodes `imgs/json/*` into `public/media/`              |
| `npm run typecheck`          | `tsc --noEmit`                                             |
| `npm run format`             | Prettier                                                   |

---

## What I found out first

The full reasoning log is in [`notes.md`](./notes.md). The three findings that
shaped the application:

**The regulatory layer is the buying argument.** Construction products sold in
the EU carry CE marking and a Declaration of Performance stating their
performance against essential characteristics — thermal conductivity, reaction
to fire, compressive strength, vapour resistance. Those declared values are what
a professional compares, because they are the values that have to be justified
later. A product page that leads with photography and buries the numbers is
answering the wrong question.

**The person who chooses is not the person who buys.** An architect specifies,
a contractor purchases, a distributor supplies, the owner pays. So the job of
this application is to help someone _choose and justify_ a product — not to sell
one. That decision removes price, stock, cart and checkout from scope, and puts
declared values, applications and documents at the centre.

**Products are sold as systems.** An insulation board is one layer of a build-up:
adhesive → board → anchor → base coat with mesh → primer → render. Compatibility
and layer order are genuine product data, not marketing. A product page that
ignores what the product is installed with is half a page, so the system
build-up is a first-class part of the schema and of the detail page.

---

## What the application does

Two entry paths, because professionals arrive in two states:

- **"I know the situation, not the products."** The
  [application index](http://localhost:3000/applications) — external wall,
  pitched roof, flat roof, floor, internal partition — narrows 74 products to
  the handful approved for that construction.
- **"I know roughly what I want."** Straight to the catalogue and filter on
  declared values: λD ≤ 0.032, Euroclass A1, 100–160 mm, EPD available.

Search cuts across both, and is tolerant of typos.

**One dataset, two views.** A chip grid of material photography for browsing,
and a dense sortable specification schedule for comparing. `?view=grid|table`
in the URL, the same query underneath.

**All state lives in the URL.** Filters, sort, view, page and the compare
selection are all query parameters. Refreshing loses nothing, the back button
undoes exactly one filter, a narrowed catalogue can be pasted to a colleague,
and the server can render the filtered page because it can read the query
string.

Product detail runs in the order a specifier reads it: key performance at a
glance → full technical table → applications and substrates → system build-up
(drawn to scale) → documents. Plus an indicative U-value helper, the other
thicknesses in the family, and alternatives approved for the same application.

Up to three products can be compared side by side, with rows that differ set in
full contrast and rows that agree dropped back.

---

## Scope

**In:** product list with server-side search, faceted filters with real counts,
sort and pagination · product detail · application index · compare · all seven
required states · responsive · keyboard-operable · WCAG AA · Docker.

**Deliberately out:** prices, stock, cart, checkout (distributor concerns, not
discovery) · accounts and saved projects · multi-language · supplier and admin
panels · real manufacturer data · an automated test suite.

The last one is the significant omission. See
[Accessibility](#accessibility) for what I did instead, and
[Limitations](#limitations-and-next-steps) for what I would add first.

---

## Architecture

| Layer     | Choice                                          | Why                                                                                                                                                |
| --------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 16, App Router, React Server Components | Product pages must stand alone and be server-rendered: much of the traffic to a page like this arrives from a search engine, not from the homepage |
| Language  | TypeScript, `strict`                            |                                                                                                                                                    |
| Database  | PostgreSQL from the start                       | The interesting part of this problem is a dynamic `WHERE` with honest facet counts. That is a database problem                                     |
| Driver    | `pg` with hand-written SQL, **no ORM**          | The queries are the design. An ORM would have hidden the one part worth showing                                                                    |
| Styling   | Tailwind CSS v4, CSS-first tokens               |                                                                                                                                                    |
| Packaging | Docker Compose, app + db                        | One command, no setup instructions                                                                                                                 |

### The three seams

Almost all of the logic lives in three files, each with one job:

**`lib/db.ts`** — one `pg` Pool for the process, with a tagged error type so a
dead database produces a page that says so instead of a stack trace.

**`lib/catalogue.ts`** — every SQL statement in the application. Worth reading:

- `buildFilters` assembles the dynamic `WHERE` **once**, and the list query, the
  facet counts and the empty-state suggestions all reuse it. Every value is a
  numbered placeholder; nothing is interpolated. The only fragment that varies
  is `ORDER BY`, chosen from a fixed lookup keyed by an already-validated value.
- **Facet counts exclude their own dimension.** Counting categories with the
  category filter applied would show every other category at zero, which tells
  the user nothing. Excluding it answers the question actually being asked: _if
  I also picked this, how many would I get?_
- `COUNT(*) OVER()` takes the pagination total from the same scan as the page.
- Search matches two ways: `ILIKE` for substrings (codes, materials) and
  `word_similarity` for typos, at an explicit 0.45 threshold — the pg_trgm
  default of 0.6 misses a single dropped letter, and below 0.45 it starts
  matching nonsense. A GIN trigram index serves both.
- `suggestRelaxations` runs only when a filter combination returns nothing, and
  works out which single change would end it and how many products it returns.

**`lib/params.ts`** — parses, validates and clamps the query string. The rule:
malformed input degrades to a sensible default _and is reported_, never thrown.
`?page=abc` is not an error condition, it is Tuesday.

### Schema

`categories` · `applications` · `products` · `product_applications` ·
`product_components` (the ordered build-up) · `product_documents`.

Every filterable declared characteristic is a **typed, indexed column**, not a
JSON blob — filtering on JSON would have been faster to seed and much slower to
query, and would have thrown away the type checking that makes hand-written SQL
safe. Declared characteristics are nullable, because an anchor genuinely has no
thermal conductivity and a mesh has no compressive strength; `NULL` here means
what _NPD_ means on a real declaration.

The schema drops and rebuilds on every start. There is no user-owned data in a
prototype, so a database that is identical on every machine is worth more than
migration machinery.

---

## The required states

| State             | How it is handled                                                                                                                                                                       | Where to see it                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty**         | Names the change that would fix it, with the count it returns — "relax the conductivity limit to λ ≤ 0.035 W/(m·K) — 1 product" — rather than a shrug                                   | [`/products?category=mineral-wool&lambda_max=0.032&thickness_min=160`](http://localhost:3000/products?category=mineral-wool&lambda_max=0.032&thickness_min=160) |
| **Loading**       | Texture skeletons in the geometry the chips will occupy, so nothing reflows. Never a spinner. The heading and intro render immediately; the query streams in behind a Suspense boundary | Throttle the network and filter                                                                                                                                 |
| **Error**         | `app/error.tsx` distinguishes "the database is not reachable" — overwhelmingly the likely cause locally — from a genuine bug, and says what to do                                       | `docker compose stop db`, then reload                                                                                                                           |
| **Invalid input** | Parsed, clamped and _reported_: unknown values are dropped, out-of-range numbers clamped, a reversed thickness range swapped, and the page says so                                      | [`/products?page=abc&sort=nonsense&fire=X9&thickness_min=900`](http://localhost:3000/products?page=abc&sort=nonsense&fire=X9&thickness_min=900)                 |
| **Not found**     | Custom 404 for unknown slugs and unmatched URLs, with the product-code pattern and both ways back in                                                                                    | [`/products/does-not-exist`](http://localhost:3000/products/does-not-exist)                                                                                     |
| **Screen sizes**  | Mobile-first. Filters collapse to a disclosure, the schedule scrolls in its own container, the header wraps to two rows                                                                 | Resize to 390 px                                                                                                                                                |
| **Accessibility** | See below                                                                                                                                                                               |                                                                                                                                                                 |

---

## Data

**Everything in the catalogue is invented.** Kernbau does not exist. No
manufacturer's content was copied.

What is _not_ invented is the framework: λD in W/(m·K), reaction to fire as a
Euroclass under EN 13501-1, compressive strength as CS(10\Y) in kPa, vapour
diffusion as a dimensionless μ, a DoP number on every product. The values are
internally consistent — a denser slab has a lower conductivity and a higher
compressive strength, graphite-loaded EPS beats white EPS by roughly the margin
it does in practice, and no product declares a characteristic its product
standard would not require.

**Nothing here is specifiable.** Real declared performance is traceable to a
Declaration of Performance under the Construction Products Regulation, and that
traceability would be a production feature, not a detail.

### How it is built

74 products, 7 categories, 5 applications, 205 system layers.

Products are declared as **families with variants** — one slab, six thicknesses,
one datasheet, one DoP series — in `db/generate-catalogue.mjs`, which expands
them into `data/catalogue.json`. That is how a real catalogue works, and it
means no variant can drift from its family. `db/seed.ts` loads the JSON into
Postgres and does not care where it came from: a PIM export against the same
schema would replace it without changing the application.

### Sources

Referenced for the shape of the data — naming, units, classification systems. No
text or values were copied from any of them.

- **Regulation (EU) No 305/2011** (Construction Products Regulation) — what CE
  marking and a Declaration of Performance mean.
- **EN 13501-1** — reaction to fire classification (Euroclass A1–F, smoke and
  droplet sub-classes).
- **EN 13162 / 13163 / 13164 / 13171** — product standards for factory-made
  mineral wool, EPS, XPS and wood fibre, and the characteristics each declares.
- **EN 998-1** and **EN 15824** — rendering mortars and organic renders.
- **ETAG 004** — assessment of external thermal insulation composite systems,
  and why a system is approved as a whole.
- **EN ISO 6946** — thermal resistance and transmittance, behind the R and U
  figures.

The photography in `imgs/json/` was generated for this project.

---

## Design

The brief was a professional building materials company with a consistent visual
language, so the direction comes from the material itself rather than from
software convention: **studio product photography on a near-monochrome ground,
one signal colour, and the declared numbers set as numbers.**

The shape is a catalogue, not a brochure. Landing page, category rail, product
grid, product page, compare: the same sequence a specifier already knows from
every other product site, so nothing has to be learned before it can be used.

**The card has no frame.** The photograph is the only object on a product card
with a fill; the name, the code and the values sit directly on the page ground.
A grid of these reads as a row of products rather than a row of boxes, and the
photography is what carries the visual weight.

```
┌─────────────────────┐
│                     │   photograph, 14px radius, the only filled object
│                     │
└─────────────────────┘
▔▔▔▔▔▔▔▔▔───────────      thickness, drawn to scale against 300 mm
Kernlan FS 035 Facade Slab 100 mm
KB-MW-035-100
───────────────────────
λD          Fire      mm
0.035       A1       100
```

**Search is the hero.** The landing page is a centred headline, one line of
subtext, and the search field itself, with the product photograph as the stage
directly beneath it. Search is the fastest route to a product and the clearest
statement of what the site is for, so it is the first thing on the page rather
than something to look for. Below it the catalogue statistics sit on 2 px rules,
the same rule the product page uses for its four headline values.

**Colour.** An off-white ground (`#F5F5F4` light, `#131414` dark), a muted tone
for secondary text, a hairline rule, a heavier edge for anything operable, and
exactly one accent (`#14489E` / `#7FB0FF`) used _only_ where something is
interactive or stateful: links, focus rings, active filters, the current sort.
Because colour appears nowhere else, it reads unambiguously as "you can act
here". That is an accessibility decision as much as an aesthetic one. The whole
page is one theme; no section inverts.

**Shape.** One radius system, three steps, applied by role and nothing else:
photography and panels at 14 px, controls at 8 px, removable filter chips as
pills, because a pill reads as something you can take off again.

**Type.** Archivo for display, set heavy and tight. Inter for body and UI. IBM
Plex Mono with tabular figures for **every number, code and standard in the
interface**, so values read as measured rather than as copy, and spec columns
line up digit under digit. The pairing is one expressive display face against
one neutral workhorse, which is the only thing that has to be true of it.

**Products in a family share one photograph**, because they share one datasheet.
Each card crops the shared image differently from a hash of its slug, so a grid
of twelve thicknesses never reads as twelve copies of one picture, and the
drawn thickness scale under each photograph is what actually separates the same
slab at 60 mm and at 160 mm.

**Two visual languages, one system.** Photography identifies _what_ a product
is. Drawn hatch shows _anatomy_: the cross-section on a product page is drawn to
scale, with conventional hatch per material and a dimension label against every
band, so the hatch is never the only carrier of meaning. Because a 1 mm mesh and
a 3 mm render cannot both label at their true centre, the labels fan out to a
minimum spacing and leader lines carry the association, the way a real
construction detail does it.

**Motion is CSS only, and no animation layer depends on JavaScript.** Hero
content rises in reading order on load; sections rise as they reach the viewport
on a scroll-driven timeline (`animation-timeline: view()`), so there is no
observer and no hydration cost; a card's photograph scales slightly under the
cursor to confirm the whole card is one target; results sweep in after a filter
changes, to make it visible that the set was rebuilt rather than left alone. A
browser without support for the scroll timeline shows the finished state, which
is also exactly what `prefers-reduced-motion` resolves to. Filters, schedule and
compare have no motion at all: animation on a data table reads as amateur to
this audience.

> Motion was first built with the Motion library. It was replaced with CSS
> because `whileInView` starts its subject at `opacity: 0`, which means a
> visitor with JavaScript disabled never sees the content at all. Everything
> else on this site works without JavaScript, and an animation is not a good
> reason to break that.

---

## Accessibility

Target: **WCAG 2.1 AA**.

Built in: skip link · landmarks and one `h1` per page · visible focus rings in
the signal colour · filters that are a real `<form method="GET">`, so every
filter is a URL and nothing depends on client-side state · `aria-live` result
counts · semantic tables with `scope` and `aria-sort` on sortable headers ·
meaningful alt text on photography, with decorative images marked `alt=""` ·
hatch never the sole carrier of meaning · `prefers-reduced-motion` respected.

### What the audit found

**axe-core**, driven over the running app in **both themes**:

| Page                   | Light | Dark  |
| ---------------------- | ----- | ----- |
| `/`                    | clean | clean |
| `/products` (chips)    | clean | clean |
| `/products?view=table` | clean | clean |
| `/products/[slug]`     | clean | clean |
| `/applications`        | clean | clean |
| `/applications/[slug]` | clean | clean |
| `/compare`             | clean | clean |
| `/about`, 404          | clean | clean |

Four real defects were found this way and fixed:

1. The "at a glance" definition list on the detail page contained a stray `<p>`,
   which is invalid inside a `<dl>`.
2. **The muted text colour failed AA in the light theme** — `#7A7A76` on the
   concrete ground is 3.51:1, not the 4.5:1 it needed. The first audit run
   missed it because the browser was in dark mode, where the same token passes.
   Auditing both themes caught it.
3. When the layout gained alternating **sunken** sections, muted text failed
   again — it had been solved against two of the three grounds, not all three.
   Muted is now `#61615D`, which clears 4.5:1 on every light ground.
4. Secondary text on the inverted bands was set with opacity (`text-surface/70`).
   That cannot work in both themes, because the ink ground flips with the theme
   and the tone has to flip with it. It became a real token defined per theme,
   and the inverted bands themselves were dropped in the redesign that followed,
   so the page now holds one theme end to end.

The second one also exposed a gap in the token system: hairlines and the borders
of things you can operate were the same colour. Control borders now use their
own `--edge` token, clearing the 3:1 that WCAG 1.4.11 requires for user
interface components, while `--rule` stays a hairline for decorative dividers.

Measured contrast, worst case across the grounds each token sits on:

|                      | Light   | Dark    |
| -------------------- | ------- | ------- |
| Primary text         | 14.74:1 | 14.25:1 |
| Muted text           | 5.40:1  | 5.82:1  |
| Signal colour        | 7.11:1  | 7.60:1  |
| Control borders      | 3.20:1  | 4.02:1  |
| Primary button label | 16.29:1 | 15.73:1 |

### Manual pass

- [x] Keyboard-only traversal of the full path: home → application index →
      application → filtered catalogue → product → compare. No traps, focus
      visible at every step.
- [x] Filter state survives refresh, sharing and the back button.
- [x] 200% zoom (tested at a 720 px viewport): no loss of content, no
      horizontal scrolling; filters collapse to a disclosure and the schedule
      scrolls in its own container.
- [x] `prefers-reduced-motion: reduce` renders every sequence as its static end
      state rather than playing it faster.
- [x] Both themes checked at the token level, with the numbers above.

**Honest caveat on JavaScript.** Filters, sort, view switching and pagination
are all plain GET forms and links, so none of them depend on client-side state.
But the results grid streams in behind a Suspense boundary, and React needs
JavaScript to swap streamed content into place — so with JavaScript disabled the
catalogue page shows its skeleton. Every other page renders completely without
it. Removing the boundary would fix that at the cost of the skeleton loading
state, which the brief asks for; the skeleton won.

## Performance

The eleven source photographs are 7.6 MB. Untouched, that alone fails any
sensible performance target, so `npm run media:optimise` re-encodes them to
**0.7 MB total** and normalises their tone — the macros drift green and one runs
warm, and a shared desaturation pulls them into one range more cheaply than
reshooting. `next/image` then derives AVIF and WebP at the widths each layout
actually asks for, with explicit `sizes` on every image and long cache lifetimes
because the sources never change.

The client bundle carries no animation library and no state library. Every
entrance is a CSS animation and every filter is a `<form method="GET">`, so the
only client components on the site are the theme toggle, the U-value calculator
and the filter panel's collapse on small screens.

Pages that read the database render per request; only `/about` and the 404 are
static. That is deliberate: the database does not exist during `docker build`,
and a catalogue whose stock of products changes should not be baked into a
bundle.

---

## Limitations and next steps

**Known limitations**

- Every declared value is invented. Nothing here is specifiable.
- One market, one language. The schema keeps text separable so translation is an
  addition rather than a rewrite, but nothing is translated.
- Documents are stubs — a real catalogue links the actual DoP, EPD and datasheet
  PDFs, and that link is the whole point of the DoP.
- The U-value helper is indicative. A specification figure comes from a full
  EN ISO 6946 calculation including fixings and thermal bridging.
- Typo tolerance is per-word: "kernpore" and "wol" match, "mienral wol" does not.
- Two photographs do double duty as both an application header and a material
  texture. Alt text describes what is actually in each image.
- The 404 for an unknown product slug is the site-wide 404 page. A
  segment-scoped `not-found.tsx` was not picked up in this Next version, and one
  good 404 was worth more than working around it.

**What I would do next, in order**

1. **Tests.** Playwright for the happy path and the URL-state contract; unit
   tests for `lib/params.ts`, which is pure and is exactly where an off-by-one
   would hide.
2. **Real DoP traceability** — link every declared value to the document that
   backs it, which is the feature that would make this trustworthy.
3. **A saved specification** — the natural next step once someone has compared
   three boards.
4. **i18n**, using the separable text fields already in the schema.
5. **Query-level caching** of facet counts, which are the most repeated queries.

---

## Repository map

```
app/                     routes — landing, catalogue, product, applications,
                         compare, about, robots.ts, sitemap.ts, error, 404
components/              product card, search field, thickness bar, schedule,
                         filters, section drawing, hatch library, U-value
                         helper, skeletons
lib/
  db.ts                  pg Pool, tagged connection error
  catalogue.ts           every SQL query in the application
  params.ts              URL parsing, validation, clamping
  media.ts               texture ↔ photograph mapping and alt text
  format.ts              value formatting, R-value
db/
  schema.sql             tables, constraints, indexes
  seed.ts                loads data/catalogue.json into Postgres
  generate-catalogue.mjs authors the fictional catalogue
data/catalogue.json      the seed data — the swappable part
scripts/                 image optimisation
docker-compose.yml       app + db, one command
notes.md                 the reasoning log written during the work
```
