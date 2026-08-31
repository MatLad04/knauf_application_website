/**
 * Every SQL statement in the application lives here, and every one uses
 * numbered placeholders. The one fragment that varies — ORDER BY — is chosen
 * from a fixed lookup keyed by an already-validated sort key.
 *
 * `buildFilters` assembles the dynamic WHERE once; the list, the facet counts
 * and the relaxation suggestions all reuse it.
 */

import { query, queryOne } from "./db";
import type { ProductQuery, SortKey } from "./params";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Category = {
  slug: string;
  name: string;
  summary: string;
  textureKey: string;
  sortOrder: number;
};

export type Application = {
  slug: string;
  name: string;
  indexNo: number;
  summary: string;
  description: string;
  imageKey: string;
  buildUp: string[];
};

export type ProductRef = { slug: string; name: string; code: string };

export type Product = {
  id: number;
  slug: string;
  code: string;
  name: string;
  family: string;
  familyName: string;
  categorySlug: string;
  categoryName: string;
  textureKey: string;
  summary: string;
  description: string;
  standard: string;
  dopNumber: string;
  ceMarked: boolean;
  thermalConductivity: number | null;
  reactionToFire: string | null;
  fireRank: number | null;
  compressiveStrengthKpa: number | null;
  vapourResistanceMu: number | null;
  densityKgm3: number | null;
  thicknessMm: number | null;
  acousticRwDb: number | null;
  epdAvailable: boolean;
  formatMm: string | null;
  variantLabel: string | null;
  variantNote: string | null;
  consumption: string | null;
  substrates: string[];
  applications: { slug: string; name: string; isPrimary: boolean }[];
};

export type ProductDetail = Product & {
  components: {
    position: number;
    layerLabel: string;
    note: string | null;
    product: (ProductRef & { thicknessMm: number | null; categoryName: string }) | null;
  }[];
  documents: {
    kind: "dop" | "epd" | "datasheet" | "ce";
    title: string;
    reference: string;
    issuedOn: string;
  }[];
  usedIn: ProductRef[];
};

export type FacetValue = { value: string; label: string; count: number; note?: string };

export type Facets = {
  categories: FacetValue[];
  applications: FacetValue[];
  fireClasses: FacetValue[];
  epdCount: number;
  bounds: {
    lambdaMin: number;
    lambdaMax: number;
    thicknessMin: number;
    thicknessMax: number;
  };
};

export type ProductPage = {
  products: Product[];
  total: number;
  page: number;
  pageCount: number;
};

/** One way out of an empty result set, with the number of products it returns. */
export type Relaxation = {
  label: string;
  count: number;
  overrides: Partial<ProductQuery>;
};

// ---------------------------------------------------------------------------
// Dynamic WHERE
// ---------------------------------------------------------------------------

/** Trigram threshold for tolerant search — see buildFilters. */
const SEARCH_SIMILARITY = 0.45;

/** The filter dimensions a facet count can exclude from its own tally. */
type Dimension = "category" | "application" | "fire" | "lambda" | "thickness" | "epd" | "search";

class Filters {
  readonly values: unknown[] = [];
  readonly clauses: string[] = [];

  /** Registers a value and returns its placeholder. Nothing else may reach SQL. */
  bind(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }

  where(clause: string): void {
    this.clauses.push(clause);
  }

  get sql(): string {
    return this.clauses.length ? this.clauses.join(" AND ") : "TRUE";
  }
}

function buildFilters(q: ProductQuery, exclude?: Dimension): Filters {
  const f = new Filters();

  if (q.q && exclude !== "search") {
    // Two ways to match. ILIKE catches substrings, which is what people type for
    // codes and materials ("035", "wool"). word_similarity is pg_trgm's typo
    // tolerance, and catches "wol" and "kernpore". The threshold is explicit
    // rather than the 0.6 default: 0.6 misses a single dropped letter, and
    // anything below 0.45 starts matching nonsense.
    const term = f.bind(q.q);
    const threshold = f.bind(SEARCH_SIMILARITY);
    f.where(
      `(p.search_blob ILIKE '%' || ${term} || '%'
        OR word_similarity(${term}, p.search_blob) > ${threshold})`,
    );
  }

  if (q.categories.length && exclude !== "category") {
    const slugs = f.bind(q.categories);
    f.where(`p.category_id IN (SELECT id FROM categories WHERE slug = ANY(${slugs}::text[]))`);
  }

  if (q.applications.length && exclude !== "application") {
    const slugs = f.bind(q.applications);
    f.where(
      `EXISTS (
         SELECT 1 FROM product_applications pa
         JOIN applications a ON a.id = pa.application_id
         WHERE pa.product_id = p.id AND a.slug = ANY(${slugs}::text[])
       )`,
    );
  }

  if (q.fireClasses.length && exclude !== "fire") {
    const classes = f.bind(q.fireClasses);
    f.where(`p.reaction_to_fire = ANY(${classes}::text[])`);
  }

  if (q.lambdaMax !== null && exclude !== "lambda") {
    // A product with no declared conductivity is out of scope for a thermal
    // filter, not a near miss.
    f.where(
      `p.thermal_conductivity IS NOT NULL AND p.thermal_conductivity <= ${f.bind(q.lambdaMax)}`,
    );
  }

  if (exclude !== "thickness") {
    if (q.thicknessMin !== null) f.where(`p.thickness_mm >= ${f.bind(q.thicknessMin)}`);
    if (q.thicknessMax !== null) f.where(`p.thickness_mm <= ${f.bind(q.thicknessMax)}`);
  }

  if (q.epdOnly && exclude !== "epd") {
    f.where("p.epd_available");
  }

  return f;
}

/** Constant fragments. The user picks an entry, never what is in it. */
const ORDER_BY: Record<Exclude<SortKey, "relevance">, string> = {
  code: "p.sort_order, p.code",
  "lambda-asc": "p.thermal_conductivity ASC NULLS LAST, p.thickness_mm ASC, p.code",
  "lambda-desc": "p.thermal_conductivity DESC NULLS LAST, p.code",
  "thickness-asc": "p.thickness_mm ASC NULLS LAST, p.code",
  "thickness-desc": "p.thickness_mm DESC NULLS LAST, p.code",
  "fire-asc": "p.fire_rank ASC NULLS LAST, p.thermal_conductivity ASC NULLS LAST, p.code",
  "density-desc": "p.density_kgm3 DESC NULLS LAST, p.code",
};

// ---------------------------------------------------------------------------
// Row shapes and mapping
// ---------------------------------------------------------------------------

type ProductRow = {
  id: number;
  slug: string;
  code: string;
  name: string;
  family: string;
  family_name: string;
  category_slug: string;
  category_name: string;
  texture_key: string;
  summary: string;
  description: string;
  standard: string;
  dop_number: string;
  ce_marked: boolean;
  thermal_conductivity: number | null;
  reaction_to_fire: string | null;
  fire_rank: number | null;
  compressive_strength_kpa: number | null;
  vapour_resistance_mu: number | null;
  density_kgm3: number | null;
  thickness_mm: number | null;
  acoustic_rw_db: number | null;
  epd_available: boolean;
  format_mm: string | null;
  variant_label: string | null;
  variant_note: string | null;
  consumption: string | null;
  substrates: string[];
  applications: { slug: string; name: string; is_primary: boolean }[] | null;
  total_count?: number;
};

const PRODUCT_COLUMNS = `
  p.id, p.slug, p.code, p.name, p.family, p.family_name,
  c.slug AS category_slug, c.name AS category_name, p.texture_key,
  p.summary, p.description, p.standard, p.dop_number, p.ce_marked,
  p.thermal_conductivity, p.reaction_to_fire, p.fire_rank,
  p.compressive_strength_kpa, p.vapour_resistance_mu, p.density_kgm3,
  p.thickness_mm, p.acoustic_rw_db, p.epd_available,
  p.format_mm, p.variant_label, p.variant_note, p.consumption, p.substrates,
  COALESCE(apps.list, '[]'::json) AS applications`;

const PRODUCT_FROM = `
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN LATERAL (
    SELECT json_agg(
             json_build_object('slug', a.slug, 'name', a.name, 'is_primary', pa.is_primary)
             ORDER BY a.index_no
           ) AS list
    FROM product_applications pa
    JOIN applications a ON a.id = pa.application_id
    WHERE pa.product_id = p.id
  ) apps ON true`;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    family: row.family,
    familyName: row.family_name,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    textureKey: row.texture_key,
    summary: row.summary,
    description: row.description,
    standard: row.standard,
    dopNumber: row.dop_number,
    ceMarked: row.ce_marked,
    thermalConductivity: row.thermal_conductivity,
    reactionToFire: row.reaction_to_fire,
    fireRank: row.fire_rank,
    compressiveStrengthKpa: row.compressive_strength_kpa,
    vapourResistanceMu: row.vapour_resistance_mu,
    densityKgm3: row.density_kgm3,
    thicknessMm: row.thickness_mm,
    acousticRwDb: row.acoustic_rw_db,
    epdAvailable: row.epd_available,
    formatMm: row.format_mm,
    variantLabel: row.variant_label,
    variantNote: row.variant_note,
    consumption: row.consumption,
    substrates: row.substrates ?? [],
    applications: (row.applications ?? []).map((a) => ({
      slug: a.slug,
      name: a.name,
      isPrimary: a.is_primary,
    })),
  };
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listProducts(q: ProductQuery): Promise<ProductPage> {
  const f = buildFilters(q);

  let orderBy: string;
  if (q.sort === "relevance" && q.q) {
    // Exact code, then name prefix, then trigram closeness. Ties fall back to
    // catalogue order so the list never shuffles between renders.
    const term = f.bind(q.q);
    orderBy = `
      CASE
        WHEN p.code ILIKE ${term} THEN 0
        WHEN p.name ILIKE ${term} || '%' THEN 1
        WHEN p.code ILIKE '%' || ${term} || '%' THEN 2
        ELSE 3
      END,
      word_similarity(${term}, p.search_blob) DESC,
      p.sort_order`;
  } else {
    orderBy = ORDER_BY[q.sort === "relevance" ? "code" : q.sort];
  }

  // The grid grows rather than turning over: `page` is how many pages worth
  // have been asked for, so one query returns the whole visible set and the
  // results already on screen keep their position when more arrive.
  const limit = f.bind(q.page * q.perPage);

  // COUNT(*) OVER() takes the total from the same scan as the rows.
  const rows = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS}, COUNT(*) OVER() AS total_count
     ${PRODUCT_FROM}
     WHERE ${f.sql}
     ORDER BY ${orderBy}
     LIMIT ${limit}`,
    f.values,
  );

  const total = rows[0]?.total_count ?? 0;
  return {
    products: rows.map(toProduct),
    total,
    page: q.page,
    pageCount: Math.max(1, Math.ceil(total / q.perPage)),
  };
}

// ---------------------------------------------------------------------------
// Facets
// ---------------------------------------------------------------------------

/**
 * How many products match, without fetching any. The toolbar and the filter
 * rail are answered by this while the grid itself is still running, so
 * switching view or sort leaves everything but the products on the screen.
 */
export async function countProducts(q: ProductQuery): Promise<number> {
  const f = buildFilters(q);
  const rows = await query<{ total: number }>(
    `SELECT count(*)::int AS total ${PRODUCT_FROM} WHERE ${f.sql}`,
    f.values,
  );
  return rows[0]?.total ?? 0;
}

export async function getFacets(q: ProductQuery): Promise<Facets> {
  const categoryFilters = buildFilters(q, "category");
  const applicationFilters = buildFilters(q, "application");
  const fireFilters = buildFilters(q, "fire");
  const epdFilters = buildFilters(q, "epd");

  const [categories, applications, fireClasses, epd, bounds] = await Promise.all([
    // Filters in the ON clause of a LEFT JOIN from the dimension table, so a
    // category matching nothing still appears at zero instead of vanishing and
    // making the filter list jump.
    query<{ slug: string; name: string; count: number }>(
      `SELECT c.slug, c.name, count(p.id)::int AS count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND (${categoryFilters.sql})
       GROUP BY c.slug, c.name, c.sort_order
       ORDER BY c.sort_order`,
      categoryFilters.values,
    ),
    query<{ slug: string; name: string; count: number }>(
      `SELECT a.slug, a.name, count(DISTINCT p.id)::int AS count
       FROM applications a
       LEFT JOIN product_applications pa ON pa.application_id = a.id
       LEFT JOIN products p ON p.id = pa.product_id AND (${applicationFilters.sql})
       GROUP BY a.slug, a.name, a.index_no
       ORDER BY a.index_no`,
      applicationFilters.values,
    ),
    query<{ value: string; count: number }>(
      `WITH declared AS (
         SELECT DISTINCT reaction_to_fire AS value, fire_rank
         FROM products WHERE reaction_to_fire IS NOT NULL
       )
       SELECT d.value, count(p.id)::int AS count
       FROM declared d
       LEFT JOIN products p ON p.reaction_to_fire = d.value AND (${fireFilters.sql})
       GROUP BY d.value, d.fire_rank
       ORDER BY d.fire_rank`,
      fireFilters.values,
    ),
    queryOne<{ count: number }>(
      `SELECT count(*) FILTER (WHERE p.epd_available)::int AS count
       FROM products p WHERE ${epdFilters.sql}`,
      epdFilters.values,
    ),
    queryOne<{
      lambda_min: number;
      lambda_max: number;
      thickness_min: number;
      thickness_max: number;
    }>(
      `SELECT min(thermal_conductivity) AS lambda_min,
              max(thermal_conductivity) AS lambda_max,
              min(thickness_mm)::int    AS thickness_min,
              max(thickness_mm)::int    AS thickness_max
       FROM products`,
    ),
  ]);

  return {
    categories: categories.map((r) => ({ value: r.slug, label: r.name, count: r.count })),
    applications: applications.map((r) => ({ value: r.slug, label: r.name, count: r.count })),
    fireClasses: fireClasses.map((r) => ({ value: r.value, label: r.value, count: r.count })),
    epdCount: epd?.count ?? 0,
    bounds: {
      lambdaMin: bounds?.lambda_min ?? 0.03,
      lambdaMax: bounds?.lambda_max ?? 0.05,
      thicknessMin: bounds?.thickness_min ?? 20,
      thicknessMax: bounds?.thickness_max ?? 200,
    },
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

async function countWith(q: ProductQuery): Promise<number> {
  const f = buildFilters(q);
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM products p WHERE ${f.sql}`,
    f.values,
  );
  return row?.count ?? 0;
}

/**
 * Works out which single change would end an empty result, and how many
 * products it would return. Only runs when there are no results.
 */
export async function suggestRelaxations(q: ProductQuery): Promise<Relaxation[]> {
  const candidates: { label: string; overrides: Partial<ProductQuery> }[] = [];

  if (q.lambdaMax !== null) {
    // For a numeric filter, offer the nearest value that actually returns
    // something — "relax λ to ≤ 0.038" beats "remove the λ filter".
    const f = buildFilters({ ...q, lambdaMax: null });
    const row = await queryOne<{ next: number | null }>(
      `SELECT min(p.thermal_conductivity) AS next
       FROM products p
       WHERE ${f.sql} AND p.thermal_conductivity > $${f.values.length + 1}`,
      [...f.values, q.lambdaMax],
    );
    if (row?.next != null) {
      const next = Math.ceil(row.next * 1000) / 1000;
      candidates.push({
        label: `relax the conductivity limit to λ ≤ ${next.toFixed(3)} W/(m·K)`,
        overrides: { lambdaMax: next },
      });
    }
    candidates.push({
      label: "drop the thermal conductivity limit",
      overrides: { lambdaMax: null },
    });
  }

  if (q.thicknessMin !== null || q.thicknessMax !== null) {
    candidates.push({
      label: "widen the thickness range",
      overrides: { thicknessMin: null, thicknessMax: null },
    });
  }

  if (q.fireClasses.length) {
    candidates.push({
      label:
        q.fireClasses.length === 1
          ? `allow reaction-to-fire classes other than ${q.fireClasses[0]}`
          : "drop the reaction-to-fire filter",
      overrides: { fireClasses: [] },
    });
  }

  if (q.epdOnly) {
    candidates.push({
      label: "include products without an EPD",
      overrides: { epdOnly: false },
    });
  }

  if (q.categories.length) {
    candidates.push({
      label: "search across all product categories",
      overrides: { categories: [] },
    });
  }

  if (q.applications.length) {
    candidates.push({ label: "search across all applications", overrides: { applications: [] } });
  }

  if (q.q) {
    candidates.push({ label: `clear the search term “${q.q}”`, overrides: { q: "" } });
  }

  const counted = await Promise.all(
    candidates.map(async (candidate) => ({
      ...candidate,
      count: await countWith({ ...q, ...candidate.overrides, page: 1 }),
    })),
  );

  return counted
    .filter((candidate) => candidate.count > 0)
    .sort((a, b) => a.count - b.count) // smallest change that works, first
    .slice(0, 3);
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const row = await queryOne<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_FROM} WHERE p.slug = $1`,
    [slug],
  );
  if (!row) return null;

  const [components, documents, usedIn] = await Promise.all([
    query<{
      position: number;
      layer_label: string;
      note: string | null;
      slug: string | null;
      name: string | null;
      code: string | null;
      thickness_mm: number | null;
      category_name: string | null;
    }>(
      `SELECT pc.position, pc.layer_label, pc.note,
              cp.slug, cp.name, cp.code, cp.thickness_mm, cc.name AS category_name
       FROM product_components pc
       LEFT JOIN products cp ON cp.id = pc.component_id
       LEFT JOIN categories cc ON cc.id = cp.category_id
       WHERE pc.product_id = $1
       ORDER BY pc.position`,
      [row.id],
    ),
    query<{
      kind: ProductDetail["documents"][number]["kind"];
      title: string;
      reference: string;
      issued_on: Date;
    }>(
      `SELECT kind, title, reference, issued_on
       FROM product_documents
       WHERE product_id = $1
       ORDER BY CASE kind WHEN 'dop' THEN 0 WHEN 'ce' THEN 1 WHEN 'datasheet' THEN 2 ELSE 3 END`,
      [row.id],
    ),
    // The reverse of the build-up: the systems this product is a layer of.
    query<{ slug: string; name: string; code: string }>(
      `SELECT DISTINCT ON (host.family) host.slug, host.name, host.code
       FROM product_components pc
       JOIN products host ON host.id = pc.product_id
       WHERE pc.component_id = $1 AND host.id <> $1
       ORDER BY host.family, host.sort_order
       LIMIT 6`,
      [row.id],
    ),
  ]);

  return {
    ...toProduct(row),
    components: components.map((c) => ({
      position: c.position,
      layerLabel: c.layer_label,
      note: c.note,
      product:
        c.slug && c.name && c.code
          ? {
              slug: c.slug,
              name: c.name,
              code: c.code,
              thicknessMm: c.thickness_mm,
              categoryName: c.category_name ?? "",
            }
          : null,
    })),
    documents: documents.map((d) => ({
      kind: d.kind,
      title: d.title,
      reference: d.reference,
      issuedOn:
        d.issued_on instanceof Date ? d.issued_on.toISOString().slice(0, 10) : String(d.issued_on),
    })),
    usedIn,
  };
}

/** Other thicknesses of the same slab: same datasheet, different line. */
export async function getFamilyVariants(product: Product): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_FROM}
     WHERE p.family = $1 AND p.id <> $2
     ORDER BY p.thickness_mm NULLS LAST, p.code`,
    [product.family, product.id],
  );
  return rows.map(toProduct);
}

/**
 * A different family approved for the same application, ordered by how close
 * its declared conductivity is to this one's.
 */
export async function getAlternatives(product: Product): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_FROM}
     WHERE p.family <> $1
       AND EXISTS (
         SELECT 1
         FROM product_applications pa
         JOIN product_applications mine ON mine.application_id = pa.application_id
         WHERE pa.product_id = p.id AND mine.product_id = $2
       )
       AND ($3::numeric IS NULL OR p.thermal_conductivity IS NOT NULL)
       AND ($4::int IS NULL OR p.thickness_mm IS NOT NULL)
     ORDER BY
       CASE WHEN $3::numeric IS NULL THEN 0
            ELSE abs(p.thermal_conductivity - $3::numeric) END,
       CASE WHEN $4::int IS NULL THEN 0
            ELSE abs(p.thickness_mm - $4::int) END,
       p.sort_order
     LIMIT 4`,
    [product.family, product.id, product.thermalConductivity, product.thicknessMm],
  );
  return rows.map(toProduct);
}

/** Compare view: the given slugs, in the order the URL asked for them. */
export async function getProductsBySlugs(slugs: readonly string[]): Promise<Product[]> {
  if (slugs.length === 0) return [];
  const rows = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_FROM} WHERE p.slug = ANY($1::text[])`,
    [slugs],
  );
  const bySlug = new Map(rows.map((row) => [row.slug, toProduct(row)]));
  return slugs.map((slug) => bySlug.get(slug)).filter((p): p is Product => p !== undefined);
}

/**
 * The whole catalogue, in catalogue order.
 *
 * The basket and the shortlist live in the browser, so the server rendering
 * those two pages cannot know which slugs it is about to be asked for — there
 * is no URL to read them off and no session to look them up in. Seventy-four
 * products is small enough to hand over whole and let the page pick from it,
 * which is cheaper than a round trip per line and leaves the two pages
 * renderable with no client fetch at all.
 */
export async function getAllProducts(): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_FROM} ORDER BY p.sort_order, p.code`,
  );
  return rows.map(toProduct);
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<(Category & { productCount: number })[]> {
  const rows = await query<{
    slug: string;
    name: string;
    summary: string;
    texture_key: string;
    sort_order: number;
    product_count: number;
  }>(
    `SELECT c.slug, c.name, c.summary, c.texture_key, c.sort_order,
            count(p.id)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.sort_order`,
  );
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    summary: r.summary,
    textureKey: r.texture_key,
    sortOrder: r.sort_order,
    productCount: r.product_count,
  }));
}

type ApplicationRow = {
  slug: string;
  name: string;
  index_no: number;
  summary: string;
  description: string;
  image_key: string;
  build_up: string[];
};

const toApplication = (r: ApplicationRow): Application => ({
  slug: r.slug,
  name: r.name,
  indexNo: r.index_no,
  summary: r.summary,
  description: r.description,
  imageKey: r.image_key,
  buildUp: r.build_up ?? [],
});

export async function getApplications(): Promise<(Application & { productCount: number })[]> {
  const rows = await query<ApplicationRow & { product_count: number }>(
    `SELECT a.slug, a.name, a.index_no, a.summary, a.description, a.image_key, a.build_up,
            count(pa.product_id)::int AS product_count
     FROM applications a
     LEFT JOIN product_applications pa ON pa.application_id = a.id
     GROUP BY a.id
     ORDER BY a.index_no`,
  );
  return rows.map((r) => ({ ...toApplication(r), productCount: r.product_count }));
}

export async function getApplicationBySlug(slug: string): Promise<Application | null> {
  const row = await queryOne<ApplicationRow>(
    `SELECT slug, name, index_no, summary, description, image_key, build_up
     FROM applications WHERE slug = $1`,
    [slug],
  );
  return row ? toApplication(row) : null;
}

export type Family = {
  key: string;
  name: string;
  textureKey: string;
  categoryName: string;
  productCount: number;
  /** Thinnest and thickest variant, where the family has thicknesses. */
  thicknessMin: number | null;
  thicknessMax: number | null;
  bestLambda: number | null;
};

/**
 * Products are authored as families with variants, so the family is the unit a
 * specifier recognises: one datasheet, one photograph, several thicknesses.
 * Used on the landing page as the third way into the catalogue.
 */
export async function getFamilies(limit = 8): Promise<Family[]> {
  const rows = await query<{
    family: string;
    family_name: string;
    texture_key: string;
    category_name: string;
    product_count: number;
    thickness_min: number | null;
    thickness_max: number | null;
    best_lambda: number | null;
  }>(
    `SELECT p.family, p.family_name, p.texture_key,
            min(c.name) AS category_name,
            count(*)::int AS product_count,
            min(p.thickness_mm) AS thickness_min,
            max(p.thickness_mm) AS thickness_max,
            min(p.thermal_conductivity) AS best_lambda
     FROM products p
     JOIN categories c ON c.id = p.category_id
     GROUP BY p.family, p.family_name, p.texture_key
     ORDER BY count(*) DESC, min(p.sort_order)
     LIMIT $1`,
    [limit],
  );
  return rows.map((r) => ({
    key: r.family,
    name: r.family_name,
    textureKey: r.texture_key,
    categoryName: r.category_name,
    productCount: r.product_count,
    thicknessMin: r.thickness_min,
    thicknessMax: r.thickness_max,
    bestLambda: r.best_lambda,
  }));
}

/**
 * One product per family, best conductivity first. The panel in the search bar
 * shows six of these: six thicknesses of the same slab is one answer shown six
 * times, which is worse than showing six.
 */
export async function getShowcase(limit = 6): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS} ${PRODUCT_FROM}
     WHERE p.id IN (
       SELECT DISTINCT ON (family) id FROM products
       ORDER BY family, thermal_conductivity NULLS LAST, sort_order
     )
     ORDER BY p.thermal_conductivity NULLS LAST, p.sort_order
     LIMIT $1`,
    [limit],
  );
  return rows.map(toProduct);
}

export async function getCatalogueStats(): Promise<{
  products: number;
  categories: number;
  applications: number;
  withEpd: number;
  bestLambda: number | null;
}> {
  const row = await queryOne<{
    products: number;
    categories: number;
    applications: number;
    with_epd: number;
    best_lambda: number | null;
  }>(
    `SELECT (SELECT count(*) FROM products)::int      AS products,
            (SELECT count(*) FROM categories)::int    AS categories,
            (SELECT count(*) FROM applications)::int  AS applications,
            (SELECT count(*) FROM products WHERE epd_available)::int AS with_epd,
            (SELECT min(thermal_conductivity) FROM products) AS best_lambda`,
  );
  return {
    products: row?.products ?? 0,
    categories: row?.categories ?? 0,
    applications: row?.applications ?? 0,
    withEpd: row?.with_epd ?? 0,
    bestLambda: row?.best_lambda ?? null,
  };
}

/** Sitemap input. */
export async function getAllSlugs(): Promise<{ products: string[]; applications: string[] }> {
  const [products, applications] = await Promise.all([
    query<{ slug: string }>(`SELECT slug FROM products ORDER BY sort_order`),
    query<{ slug: string }>(`SELECT slug FROM applications ORDER BY index_no`),
  ]);
  return {
    products: products.map((r) => r.slug),
    applications: applications.map((r) => r.slug),
  };
}

// ---------------------------------------------------------------------------
// The build-up configurator
// ---------------------------------------------------------------------------

/** One board family, with every depth it is actually made in. */
export type BoardFamily = {
  family: string;
  familyName: string;
  categorySlug: string;
  categoryName: string;
  /** The material key the drawn figures are keyed off. */
  textureKey: string;
  thermalConductivity: number;
  reactionToFire: string | null;
  variants: { slug: string; code: string; thicknessMm: number }[];
};

/** A component of the system that is chosen once and does not vary by depth. */
export type BuildUpPart = {
  slug: string;
  code: string;
  /**
   * The family key, and what the part is drawn as.
   *
   * Three renders that are the same hatch are three options you cannot tell
   * apart in the drawing they change, which is the one place the choice is
   * supposed to show. Mineral, silicate and silicone are different materials
   * and a section draws them differently.
   */
  family: string;
  name: string;
  /** The name without the variant on the end, which is what a schedule prints. */
  familyName: string;
  reactionToFire: string | null;
  variantLabel: string | null;
};

export type BuildUp = {
  boards: BoardFamily[];
  renders: BuildUpPart[];
  adhesive: BuildUpPart | null;
  baseCoat: BuildUpPart | null;
  mesh: BuildUpPart | null;
  primer: BuildUpPart | null;
  /** Anchors are sold by the depth of board they are driven through. */
  anchors: (BuildUpPart & { forThicknessMm: number | null })[];
};

type BuildUpRow = {
  slug: string;
  code: string;
  name: string;
  family: string;
  family_name: string;
  thickness_mm: number | null;
  thermal_conductivity: string | number | null;
  reaction_to_fire: string | null;
  variant_label: string | null;
  texture_key: string;
  category_slug: string;
  category_name: string;
  external_wall: boolean;
};

const BOARD_CATEGORIES = ["mineral-wool", "rigid-boards", "wood-fibre"];
const RENDER_FAMILIES = ["mineral", "silicate", "silicone"];

/**
 * Everything the wall configurator is allowed to put in a build-up, in one
 * round trip.
 *
 * The catalogue is 74 rows, so partitioning it in application code costs less
 * than six queries would and keeps the rule about what may go in an external
 * wall in one readable place. The important part is that nothing here is
 * invented for the configurator: the boards are the boards, the depths are the
 * depths they are made in, and the anchor lengths are the lengths they are sold
 * in — so a build-up the configurator produces is one you could order.
 */
export async function getBuildUp(): Promise<BuildUp> {
  const rows = await query<BuildUpRow>(
    `SELECT p.slug, p.code, p.name, p.family, p.family_name,
            p.thickness_mm, p.thermal_conductivity, p.reaction_to_fire,
            p.variant_label, p.texture_key,
            c.slug AS category_slug, c.name AS category_name,
            EXISTS (
              SELECT 1 FROM product_applications pa
              JOIN applications a ON a.id = pa.application_id
              WHERE pa.product_id = p.id AND a.slug = 'external-wall'
            ) AS external_wall
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ORDER BY p.sort_order, p.code`,
  );

  const part = (row: BuildUpRow): BuildUpPart => ({
    slug: row.slug,
    code: row.code,
    family: row.family,
    name: row.name,
    familyName: row.family_name,
    reactionToFire: row.reaction_to_fire,
    variantLabel: row.variant_label,
  });

  // Boards, grouped into the family a specifier recognises. A family is one
  // declared conductivity across every depth, which is the whole reason the
  // depth can be a rail rather than a second product choice.
  const byFamily = new Map<string, BoardFamily>();
  for (const row of rows) {
    if (!row.external_wall) continue;
    if (!BOARD_CATEGORIES.includes(row.category_slug)) continue;
    if (row.thickness_mm === null || row.thermal_conductivity === null) continue;

    const existing = byFamily.get(row.family);
    const board =
      existing ??
      ({
        family: row.family,
        familyName: row.family_name,
        categorySlug: row.category_slug,
        categoryName: row.category_name,
        textureKey: row.texture_key,
        thermalConductivity: Number(row.thermal_conductivity),
        reactionToFire: row.reaction_to_fire,
        variants: [],
      } satisfies BoardFamily);

    board.variants.push({ slug: row.slug, code: row.code, thicknessMm: row.thickness_mm });
    byFamily.set(row.family, board);
  }

  const boards = [...byFamily.values()]
    .filter((board) => board.variants.length > 1)
    .sort((a, b) => a.thermalConductivity - b.thermalConductivity);
  for (const board of boards) {
    board.variants.sort((a, b) => a.thicknessMm - b.thicknessMm);
  }

  const find = (family: string, code?: string) =>
    rows.find((row) => row.family === family && (!code || row.code === code));

  // The render is a choice because it is where the fire class of the finished
  // system is usually decided. One grain per family: 2.0 mm is the one that
  // gets specified, and three grains of the same render is one answer shown
  // three times.
  const renders = RENDER_FAMILIES.map((family) =>
    rows.find((row) => row.family === family && row.variant_label?.startsWith("2.0")),
  )
    .filter((row): row is BuildUpRow => Boolean(row))
    .map(part);

  const anchors = rows
    .filter((row) => row.family === "anchor")
    .map((row) => ({
      ...part(row),
      // '115 mm, for 80 mm insulation' — the second figure is the depth of
      // board the anchor is sold to suit.
      forThicknessMm: Number(row.variant_label?.match(/for (\d+)\s*mm/)?.[1] ?? "") || null,
    }))
    .sort((a, b) => (a.forThicknessMm ?? 0) - (b.forThicknessMm ?? 0));

  const adhesive = find("adhesive", "KB-AD-100") ?? find("adhesive");
  const baseCoat = find("basecoat", "KB-BC-300") ?? find("basecoat");
  const mesh = find("mesh", "KB-RM-165") ?? find("mesh");
  const primer = find("primer");

  return {
    boards,
    renders,
    adhesive: adhesive ? part(adhesive) : null,
    baseCoat: baseCoat ? part(baseCoat) : null,
    mesh: mesh ? part(mesh) : null,
    primer: primer ? part(primer) : null,
    anchors,
  };
}
