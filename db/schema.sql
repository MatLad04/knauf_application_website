-- Kernbau catalogue schema.
--
-- A product is a CE-marked article with declared performance, belonging to one
-- category, approved for one or more applications, and sold as part of a system
-- whose layers have a defined order.
--
-- Every filterable declared characteristic is a typed, indexed column rather
-- than a JSON blob, so the queries in lib/catalogue.ts stay type-checked and the
-- filters stay indexable.
--
-- Idempotent: drops and rebuilds. No user-owned data to preserve.

-- Trigram matching for tolerant search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS product_documents CASCADE;
DROP TABLE IF EXISTS product_components CASCADE;
DROP TABLE IF EXISTS product_applications CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Categories: what the product is.
CREATE TABLE categories (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  summary     text NOT NULL,
  texture_key text NOT NULL,      -- material photograph, see lib/media.ts
  sort_order  smallint NOT NULL DEFAULT 0
);

-- Applications: where the product goes. The entry point for a specifier who
-- knows the situation but not the catalogue.
CREATE TABLE applications (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  index_no    smallint NOT NULL,       -- position in the numbered typographic index
  summary     text NOT NULL,
  description text NOT NULL,
  image_key   text NOT NULL,
  build_up    text[] NOT NULL DEFAULT '{}'  -- canonical layer order, outside → inside
);

-- Products.
--
-- Declared characteristics are nullable because they genuinely are not declared
-- for every product: an anchor has no thermal conductivity, a mesh has no
-- compressive strength. NULL means what NPD means on a real declaration.
CREATE TABLE products (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  code        text NOT NULL UNIQUE,          -- KB-<FAMILY>-<VARIANT>-<SIZE>
  name        text NOT NULL,
  family      text NOT NULL,                 -- shared texture + shared datasheet family
  family_name text NOT NULL,
  category_id integer NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  summary     text NOT NULL,
  description text NOT NULL,

  -- Regulatory identity
  standard     text NOT NULL,                -- harmonised standard, e.g. 'EN 13162'
  dop_number   text NOT NULL,                -- Declaration of Performance reference
  ce_marked    boolean NOT NULL DEFAULT true,

  -- Declared characteristics
  thermal_conductivity  numeric(6,4),        -- λD in W/(m·K)
  reaction_to_fire      text,                -- Euroclass per EN 13501-1
  fire_rank             smallint,            -- 1 = A1 … 7 = F, for ordering and range filters
  compressive_strength_kpa integer,          -- CS(10\Y) in kPa
  vapour_resistance_mu  numeric(6,1),        -- μ, dimensionless
  density_kgm3          numeric(6,1),
  thickness_mm          integer,
  acoustic_rw_db        integer,             -- Rw of the tested assembly, dB
  epd_available         boolean NOT NULL DEFAULT false,

  -- Commercial / practical
  format_mm    text,                         -- board format, e.g. '1000 × 600'
  variant_label text,                        -- '100 mm', '1.5 mm grain', '165 g/m²'
  variant_note  text,                        -- one line on when this variant is the right one
  texture_key   text NOT NULL,               -- material photograph shared by the family
  consumption  text,                         -- e.g. '4.5 kg/m² at 4 mm'
  substrates   text[] NOT NULL DEFAULT '{}',

  -- Denormalised at seed time: category and application names live in other
  -- tables, and search has to reach them without a join per keystroke.
  search_blob  text NOT NULL,

  sort_order   smallint NOT NULL DEFAULT 0,

  CONSTRAINT thickness_positive CHECK (thickness_mm IS NULL OR thickness_mm > 0),
  CONSTRAINT lambda_plausible   CHECK (thermal_conductivity IS NULL
                                       OR (thermal_conductivity > 0 AND thermal_conductivity < 5)),
  CONSTRAINT fire_rank_range    CHECK (fire_rank IS NULL OR fire_rank BETWEEN 1 AND 7)
);

-- Every filterable and sortable column is indexed; the planner picks whichever
-- is selective for the filter set in the URL.
CREATE INDEX products_category_idx    ON products (category_id);
CREATE INDEX products_lambda_idx      ON products (thermal_conductivity);
CREATE INDEX products_thickness_idx   ON products (thickness_mm);
CREATE INDEX products_fire_rank_idx   ON products (fire_rank);
CREATE INDEX products_density_idx     ON products (density_kgm3);
CREATE INDEX products_epd_idx         ON products (epd_available) WHERE epd_available;
CREATE INDEX products_family_idx      ON products (family);
CREATE INDEX products_sort_idx        ON products (sort_order, code);
-- Serves both ILIKE '%…%' and word similarity. Full-text search would be the
-- wrong tool here: half the useful queries are product codes.
CREATE INDEX products_search_trgm_idx ON products USING gin (search_blob gin_trgm_ops);

-- Product ↔ application.
CREATE TABLE product_applications (
  product_id     integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  application_id integer NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  is_primary     boolean NOT NULL DEFAULT false,
  PRIMARY KEY (product_id, application_id)
);

CREATE INDEX product_applications_application_idx ON product_applications (application_id);

-- System build-up: the ordered layers a product is installed with, position 1
-- nearest the substrate. This is what makes the catalogue a system catalogue
-- rather than a list of articles.
CREATE TABLE product_components (
  id           serial PRIMARY KEY,
  product_id   integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position     smallint NOT NULL,
  component_id integer REFERENCES products(id) ON DELETE SET NULL,
  layer_label  text NOT NULL,             -- 'Adhesive', 'Insulation', 'Base coat' …
  note         text,
  UNIQUE (product_id, position)
);

CREATE INDEX product_components_product_idx ON product_components (product_id, position);

-- Documents. Stubs here; the DoP is what makes declared values traceable.
CREATE TABLE product_documents (
  id         serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('dop', 'epd', 'datasheet', 'ce')),
  title      text NOT NULL,
  reference  text NOT NULL,
  issued_on  date NOT NULL,
  url        text
);

CREATE INDEX product_documents_product_idx ON product_documents (product_id);
