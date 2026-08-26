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

### Entry-point pass

Two problems survived the redesign. The hero led with a search field, which
made the first screen a control panel rather than a statement. And the three
ways into the catalogue were three consecutive sections, each with its own
heading and its own argument, so they read as three unrelated ideas rather than
as a set of choices.

- **The hero lost its search field** and gained a full-bleed photograph, the
  catalogue figures, and one cue at the bottom naming where the search is. The
  hero now says what the site is; the section under it does the work.
- **The three ways in became one section.** _Find a product_: search across the
  top, then material, family and situation as three columns under a single
  heading. Every row is a filtered catalogue URL, and each column carries a CTA
  into the broader view of its own dimension.
- **A family became a first-class way in.** Products were already authored as
  families with variants, but nothing in the interface exposed that. A family
  row searches on the family name, which the tolerant search already handles.
- **The catalogue is called Search.** It is the main thing the site does, and
  naming it after the action rather than after the shelf says so. The grid,
  filters and cards are untouched.
- The honesty note lost its button. It was a third route to the same page the
  header and footer already link to, and the note is a footnote, not a call to
  action.

### Bar pass

The site had a search page with a search on it, and a landing page with another
search on it, and the answer to "where do I search?" was still two answers. It
also had a nav that named a shelf — Catalogue, Applications, Data — rather than
naming what a specifier comes here to do.

- **One bar, on every page, and it does not move.** The search lives in the
  furniture rather than on a page: the same field is there whether you are
  reading about a build-up or looking at 74 results, and the body under it is
  what changes. Searching is a plain GET to `/products`, so a result set is a
  URL that survives a refresh, a share and the back button, and the field works
  with no JavaScript at all.
- **Focusing it opens the catalogue's three dimensions.** Materials, families
  and systems, as three columns of real counts, because someone who has just
  clicked into a search field usually knows the job and not the product name.
  Typing narrows the three lists in place, so the panel answers the half-typed
  word instead of waiting for the whole one. From `lg` it leaves the bar and
  takes the width of the page: seven product names do not fit in the width of a
  search field, and truncating them defeats the point of listing them.
- **The first screen lost its lists and kept its objects.** The three ways in
  are three photographs with a title and a count under the headline. The lists
  themselves are one keystroke away in the bar, and a first screen is for saying
  what a thing is.
- **The catalogue page is results.** No heading block, no second search field,
  no requirement chips repeated: the count, the toolbar, the filters and the
  grid, under the same bar as everywhere else.
- **Products, Applications, Services.** Named after what a specifier is doing.
  Applications is the argument that a wall is not a shelf of products, and it is
  now one construction to a band with its build-up in installation order, rather
  than five identical cards. Services is what a manufacturer does between the
  datasheet and the finished wall. About covers the company and the data
  together, and it is in the footer, because it is a footnote to the work rather
  than a step in it.
- The whole layout reads from Postgres now, since the bar carries live counts,
  so `dynamic` moved from the individual pages up to the root layout.

### Furniture pass

Six things, all of them the same argument: the page should look like the trade
it serves, and the parts that repeat on every page should be worth repeating.

- **The hero is drawn, not photographed.** A photograph of a wall says
  marketing; the same wall in section at 1:5, on a ruled sheet with every layer
  dimensioned and named, says what the catalogue is for. It is inline SVG in
  `components/drafting-sheet.tsx` — grid, frame, hatches per material, leaders
  jogging out to a label column, an overall depth of 366 mm — and every line
  takes its colour from the theme tokens, so it inverts rather than being two
  files. The layers stack downwards because the hero is wide and short and six
  leaders across a horizontal build-up collide.
- **The bar takes the width it is worth.** Taller, a bigger wordmark, and a
  search field that runs from the navigation to the theme toggle. Clicking into
  it opens what the catalogue has before a word is typed: common searches on the
  left, six products on the right — one per family, lowest declared conductivity
  first, because six thicknesses of one slab is a single answer shown six times
  — and the three dimensions under them. Typing narrows all of it in place.
- **The results grow instead of turning over.** `page` is now how many pages
  worth have been asked for, one query returns the whole visible set, and the
  count says `24/74` rather than `1 of 4`. A specifier comparing two products
  across a page boundary loses the comparison; a page number is also a worse
  answer to "how many are there" than a count is. It is still a link, so the
  state is in the URL and it works with no JavaScript.
- **The cards lost their remaining furniture.** No fill, no frame: a rounded
  photograph, the Euroclass on it as a frosted plate because it is the one
  characteristic that rules a product out outright, and under it the two figures
  a specifier reaches for first — conductivity and thickness — set large and
  pushed to opposite corners, legible without reading a label.
- **The footer is the last informative block.** The way back up, then what the
  numbers on this site are in, which is the declared-value equivalent of a
  country and a language and without which none of them mean anything. Three
  columns, then the standards the data is shaped by where a real manufacturer
  would put social icons, and the honesty note at the foot where a legal line
  goes, because that is exactly what it is.

### Measure pass

Seven corrections, most of them about a control saying what it is doing.

- **The page takes the screen.** There is no maximum width any more: a catalogue
  is a working tool and the display it is opened on is the width it should use.
  What holds it off the edge is a gutter that grows with the viewport rather
  than a column that stops in the middle of a 27-inch monitor.
- **The bar says it is open**, not merely focused: a signal border and a soft
  ring, so the state of the field and the state of the panel are one thing.
- **The panel's column headings are headings.** Ink rather than muted, and a
  rule under them: in a panel of three lists the heading is what is read first
  and everything below it is an answer to it.
- **A count belongs to its name.** The counts sat at the far end of each column,
  a hand's width from the label, which read as a second column of unrelated
  figures. They now sit directly after the name.
- **Sorting applies as it is chosen**, and so does a filter. A select that needs
  a second click is a form pretending to be a control. Both Apply buttons are
  still rendered for a browser with no JavaScript, and removed once there is
  some — the same trick the filter rail already used for its disclosure.
- **Only the products rerun.** The Suspense boundary wrapped the whole
  catalogue, so switching Cards for Schedule replaced the toolbar and the filter
  rail with a skeleton as well. The boundary is now around the results alone,
  keyed on the parameters that actually change them, and the toolbar reads from
  a `countProducts` that does not wait on the grid. One extra query against an
  indexed count, in exchange for a rail that stays where it is.
- **The hero and the ways in are two sections.** Three photographs under a
  headline about something else are pictures; introduced under their own
  heading, they are a set of choices. The hero keeps the drawing and hands over
  with one cue.
- **The footer lost a third of its height** without losing a line: the units
  block shares the row with the three link columns rather than taking one of its
  own.

### Frame pass

- **The measure has a frame.** A drawing sheet has a margin and the content runs
  inside it, which is also the honest answer to a catalogue on a 27-inch
  monitor: 1680px is wide enough for four product cards beside a filter rail
  without a line of prose ever running past a readable length, and past that the
  gutter opens rather than the column stretching.
- **Type sits in its half, not against the edge.** In the hero and in the
  build-up section the text column is centred inside the half it occupies, so it
  reads against the drawing and the photograph rather than against the gutter,
  and the section head's lead sits beside its heading instead of at the far side
  of the screen.
- **A way in is one target.** Hovering a card carries the photograph, the name,
  the count and the argument together. The argument's colour is set on a class
  rather than a utility, because a utility wins the cascade against a component
  rule and the paragraph stayed grey while everything around it turned.
- **The footer signs off.** The wordmark is centred at the foot, where a sheet
  is signed, and the note beside it is gone — it was the third place on the page
  saying the same thing, and /about says it properly.
- **The bar has an account side.** Sign in, favourites and a basket, in the
  proportions of the shop bars this pattern comes from. None of them is built,
  so each one says so on `/in-development`: a not-issued-for-construction stamp
  and a revision table, which is how a drawing office says "not yet", and a
  paragraph on why that particular thing is out of scope — there is no basket
  because the person who chooses is not the person who buys.
- Below `lg` the section in the hero comes off and the paper stays: at 390px the
  drawing and the headline were competing for the same 300 pixels.
