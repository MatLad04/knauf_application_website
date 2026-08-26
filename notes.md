# Building Materials Company Website

This document represents working notes produced before and during implementation, and keeps a record of decisions and their reasons.
The README is the polished summary, whereas this is the reasoning behind it

### Requirements from the task guidelines

Must do (functional)

- View a list of products
- Search for products
- Filter products by relevant criteria
- Open a product and view detailed information

Must handle:

- Empty states.
- Loading states.
- Errors.
- Invalid input.
- Different screen sizes.
- Accessibility.
- Maintainability.

Must be

- Credible as the site of a professional building materials company, with a consistent visual language
- Understandable and usable without me explaining it
- A clear, maintainable solution with proportionate technical decisions
- A working result, not a broad but broken one

Extra things to add

- skeleton loaders instead of spinner on the list
- robots.txt and sitemap.xml
- Custom 404 for unknown product slugs
- Meaningful alt text; decorative images marked as such
- Favicon and OpenGraph tags
- Sensible <title> per page

### Understanding of the industry

After some research online I found that

- the strongest argument for why to buy a product is the regulatory layer
- in this industry the person who chooses the product is often not the person who buys it
- products are sold as systems rather than isolated items
  - compatibility and build-up sequence are genuine product data, not marketing
  - an insulation board is part of a system (adhesive → board → anchor → reinforcement → base coat → finish)
  - any product page that ignores compatibility is only half useful
- data is regulated, and that is the opportunity
  - construction products in the EU carry CE marking and a declaration of the product's performance against essential characteristics
- Typical declared characteristics I model in the data:
  - Thermal conductivity λ (W/m-K)
  - Reaction to fire, Euroclass A1–F (EN 13501-1)
  - Compressive strength (kPa / N/mm²)
  - Water vapour diffusion resistance μ
  - Density (kg/m³), thickness (mm)
  - Acoustic reduction R<sub>w</sub> (dB) where relevant
  - EPD availability

### Assumptions

- The primary user is a professional, not a consumer:
  - An architect decides which product goes into the building. A contractor then buys it to install it. A distributor is who they buy it from. The building owner pays for all of it, but never picks anything
  - this means that the app has to help someone choose and justify a product, not help someone buy one
- Professionals select by performance requirements, not exclusively by browsing names
  - "I need insulation with λ ≤ 0.035 that is Euroclass A1"
  - browsing a category tree is the fallback, not the main path
- Technical values are the meaningful part in this website; price, stock and ordering are distrutor concerns and are out of scope for a discovery experience at this stage
- a significant share of traffic lands directly on a product page from Google, not on the homepage
  - Google search (mineral wool insulation...) -> product detail page
  - that page must stand alone and be server-rendered
- English version is enough for this stage (prototype)
  - data model keeps text fields separable so that i18n is a later addition, not a rewrite
- No previously existing site or brans assets are given so I'll invent a finctional company
  - company name: Kernbau

### Tech Stack

- Next.js with server rendering
- Typescript
- Route Handlers as a mock REST API
- Tailwind CSS
- Playwright for testing
- Data is a fictional catalogue with plausible and consistent values
  - given the prototyping stage this list was artificially generated
- Build the frontend with json data and checking all the quality requirements first, then add the backend if time
  - to avoid having issues with backend configs, use Docker to ship the whole thing with one command locally
  - if the backend is added, containerise it so setup stays a single command

### Scope

- v1:
  - Product list with server-side search, filter, sort, pagination
  - Faceted filters: category, application, numeric ranges (λ, thickness), classes (reaction to fire), boolean (EPD available)
  - Product detail page: key performance at a glance → full technical table → applications & substrates → system components → documents
  - All seven required states handled and demonstrable
  - Responsive, keyboard-navigable, AA-contrast UI
  - README with reasoning, assumptions, limitations and sources

- few additions
  - Compare up to 3 products side by side
  - "Similar products" on the detail page
  - A tiny U-value contribution helper on insulation products

- future work / out of scope
  - prices, stock, cart, checkout because it's not how discovery of products mainly happens
  - user accounts or saved projects
  - multi-language
  - suppliers or admin panels
  - real product data from real manufacturers

### Functionality Definition

- What the application does
  - helps a professional get from a building requirement to a specific product and its declared performance, in as few steps as possible
  - not to help him buy one
- Which features are most important
  1. filter by performance
  2. product detail with structured technical data
  3. tolerant search
  4. browse by application
  5. compare products
- Which data it uses
  - fictional JSON served through an internal API
- How users interact with it
  - two entry paths
    - State A — "I know the situation, not the products."
      -> never seen the catalogue and facing a list of 40+ products is overwhelming
      -> click on one application cards (e.g. categories like roofs, floors, etc) and is now looking at 9 products instead of 40
    - State B — "I know roughly what I want, let me narrow it."
      -> returning user, or someone who came in via a category
      -> goes straight to the full list and starts applying filters
  - Search cuts across both.
  - All state in the URL
    -> every choice the user makes lives in the query string
    -> Consequences
    -> refreshing th epage loses nothing
    -> back button undoes the last filter correctly
    -> copy and share the url for easy saving or to show it to colleagues
    -> server can render the filtered page because the serve can read the url

- Whether a backend or API is necessary
  - query API only

---

## Implementation log

Written while building, after the plan above was settled. The README is the
polished summary; this is what actually happened and why.

### Decisions taken during the build

**Postgres from day one, no ORM.** The plan allowed for building against JSON
first. I went straight to Postgres because the genuinely interesting part of
this problem — a dynamic `WHERE` with facet counts that exclude their own
dimension — is a SQL problem, and doing it in JavaScript over an array would
have been both slower and less honest. All the SQL is in `lib/catalogue.ts` so
it can be read in one sitting.

**A catalogue generator instead of hand-written JSON.** Products are declared as
families with variants and expanded into `data/catalogue.json`. One slab, six
thicknesses, one datasheet — that is how a real catalogue is shaped, and it
means no variant can silently drift from its family. Integrity checks in the
generator fail the build rather than producing a broken join at seed time.

**Facet counts exclude their own dimension.** The first version counted with all
filters applied, which showed every unselected category at zero. Useless. The
counts now answer "if I also picked this, how many would I get?".

**Search matches two ways.** `ILIKE` for substrings, `word_similarity` for
typos. The pg_trgm default threshold of 0.6 misses a single dropped letter —
"wol" for "wool" returned nothing. Measured across the catalogue, 0.45 catches
"wol" (29 products) and "kernpore" (21) while still returning nothing for
nonsense. Below 0.45 it starts matching everything.

**Empty states name the fix.** When a filter set returns nothing, the app runs
one count per active filter to work out which single relaxation would end it,
and offers the smallest change that works. For the numeric filters it finds the
nearest value that actually exists rather than just offering to drop the filter.

### Things that went wrong

**Pages were prerendered at build time**, which broke `docker compose up`,
because the database does not exist during `docker build`. Fixed by rendering
database-backed routes per request — which is the right model for a catalogue
anyway.

**Unknown product slugs returned HTTP 200.** Next returns 200 for a `notFound()`
inside a _streamed_ response. `app/products/loading.tsx` was creating a Suspense
boundary over the whole `/products` subtree, including `[slug]`. Moving the
boundary inside the list page restored a real 404. A segment-scoped
`not-found.tsx` was still not picked up in this Next version, so there is one
good site-wide 404 instead of working around it.

**The muted text colour failed AA in the light theme** — 3.51:1 where 4.5:1 was
needed. The first axe run missed it because the browser was in dark mode, where
the same token passes. Auditing both themes caught it. That also exposed that
hairlines and the borders of operable controls shared one token, so control
borders now have their own at 3:1 for WCAG 1.4.11.

**Mobile had a horizontal scrollbar.** The results toolbar could not shrink, and
because the grid column sizes to its content, it widened the whole page. Fixed
with `min-w-0` and a stacking toolbar.

**Every chip in a family looked identical.** Products in a family share one
photograph by design, but twelve identical tiles read as a rendering bug rather
than as a sample wall. Each chip now crops the shared photograph differently,
from a hash of its slug — deterministic, so a product always looks the same.

**Greek symbols were being destroyed by the label style.** The mono labels
uppercase their text, which turns λ into Λ and μ into Μ. Different letters, and
in this context different meanings. A `.symbol` class opts those spans out.

### Trade-off I would flag in review

The results grid streams behind a Suspense boundary, so the skeleton loading
state works — but React needs JavaScript to swap streamed content into place,
which means the catalogue page shows its skeleton with JavaScript disabled.
Every other page renders completely without it, and every filter is still a
plain GET form. Removing the boundary would fix the no-JS case and lose the
skeleton. The brief asks for loading states explicitly and does not ask for
no-JS operation, so the skeleton won — but it is a real trade, not an oversight.

### Structure pass

The first build had the right visual language and no hierarchy — one long column
per page, sections separated only by whitespace, and the search field tucked
into a filter sidebar. It was legible but confusing: nothing told you where you
were or what a block was for.

The fix was structural, not decorative:

- **Every page is a stack of numbered bands.** A 2 px rule separates them and a
  meta bar names each one (`01 · CATALOGUE · DECLARED PERFORMANCE`). The landing
  page runs 00 to 05, each filling the viewport, so one section is on screen at
  a time. Product and application pages reuse the same shell, so the structure
  is learned once.
- **Search was promoted twice** — the landing hero and its own inverted band at
  the top of the catalogue — because search and the products are what the site
  is for, and it had been the least prominent thing on the page.
- **Products became tiles on a hairline grid**: code and name at the top, the
  material photograph in the middle, declared values and the thickness rule at
  the bottom, with one signal-filled tile as the route into the full catalogue.
- Tile borders collapse with negative margins rather than being painted as grid
  gaps, so a ragged last row leaves no empty ruled cells.
- The section drawing became a properly dimensioned figure: labels fan out to a
  minimum spacing with leader lines, because a 1 mm mesh and a 3 mm render
  cannot both label at their true centre.

Two accessibility regressions came out of the restructure, both caught by
re-running axe in both themes: muted text failed on the newly introduced sunken
ground, and the opacity-based secondary text on inverted bands could not work in
both themes at once — the ink ground flips with the theme, so the tone has to be
a token that flips with it, not an alpha value.

### Redesign pass

The numbered-band structure fixed the hierarchy problem and created a new one:
the page announced itself before it showed anything. Every section carried a
number and a meta bar, bands inverted from dark to light and back, and a
first-time visitor had to read the scaffolding before reaching a product. It
looked considered and behaved like a document, not like a place to find a
product.

The second pass reshaped it as what it actually is, a catalogue:

- **The scaffolding went.** Section numbers, meta bars, the alternating
  inverted bands and the decorative grid paper are all gone. Sections are
  separated by space and a hairline, and a heading says what each one is.
- **The card lost its frame.** The photograph is now the only object with a
  fill; the name, code and declared values sit directly on the page ground.
  Twenty-four framed tiles read as twenty-four boxes. Twenty-four unframed
  cards read as twenty-four products.
- **Search moved into the hero.** It was worth deciding rather than assuming:
  the alternative is a hero that states a position and a search field further
  down. But search is the fastest route to a product, and putting it first says
  what the site is for without a sentence explaining it. The old landing hero
  also carried a second search band at the top of the catalogue; that stayed,
  because the two are different moments.
- **Filters became removable.** Active filters now render as chips with a
  cross, above the results. Previously the only way to undo a filter was to
  find it again in the rail, which is the standard complaint about faceted
  search.
- **Type.** Archivo stayed for display. Instrument Sans was replaced by Inter,
  which is the neutral half of the pairing this catalogue wants: nothing about
  the body face should be interesting.

**Motion was built twice.** The first version used the Motion library with
`whileInView`, which starts its subject at `opacity: 0` and animates on an
intersection observer. That works, and it also means that with JavaScript
disabled the entire page below the hero never appears. Everything else here
renders without JavaScript, so the animation layer was rewritten in CSS:
`animation-timeline: view()` for scroll entrances, a plain keyframe with a
delay chain for the hero. A browser without support for the scroll timeline
shows the finished state, which is the same state `prefers-reduced-motion`
resolves to. The library came back out of `package.json`.

**Two things the redesign broke and the audit caught.** Products in a family
share one photograph, and the larger cards made the shared crop obvious in a
way the smaller tiles had not, so the crop variance was widened and the drawn
thickness scale moved back onto the card, where it separates a 60 mm slab from
a 160 mm one with information rather than decoration. And the product code sat
in the same row as the name, which pushed past the viewport on a 390 px screen;
it now sits under the name, where no column width can collide with it.
