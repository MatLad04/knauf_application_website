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
