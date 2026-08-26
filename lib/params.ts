/**
 * Parses, validates and clamps the URL state for the product list.
 *
 * All list state lives in the query string, which makes it shareable and
 * refreshable — and untrusted. The rule here: malformed input degrades to a
 * sensible default and is reported back, never thrown.
 */

export const FIRE_CLASSES = [
  { value: "A1", rank: 1, label: "A1", note: "No contribution to fire" },
  { value: "A2-s1,d0", rank: 2, label: "A2-s1,d0", note: "Limited contribution" },
  { value: "B-s1,d0", rank: 3, label: "B-s1,d0", note: "Very limited contribution" },
  { value: "C-s2,d0", rank: 4, label: "C-s2,d0", note: "Minor contribution" },
  { value: "D-s2,d0", rank: 5, label: "D-s2,d0", note: "Acceptable contribution" },
  { value: "E", rank: 6, label: "E", note: "Combustible" },
  { value: "F", rank: 7, label: "F", note: "No performance determined" },
] as const;

const FIRE_VALUES: readonly string[] = FIRE_CLASSES.map((c) => c.value);

export const SORT_OPTIONS = [
  { key: "relevance", label: "Relevance" },
  { key: "code", label: "Product code" },
  { key: "lambda-asc", label: "Thermal conductivity, lowest first" },
  { key: "lambda-desc", label: "Thermal conductivity, highest first" },
  { key: "thickness-asc", label: "Thickness, thinnest first" },
  { key: "thickness-desc", label: "Thickness, thickest first" },
  { key: "fire-asc", label: "Reaction to fire, best first" },
  { key: "density-desc", label: "Density, highest first" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["key"];
const SORT_KEYS: readonly string[] = SORT_OPTIONS.map((o) => o.key);

export type ViewMode = "grid" | "table";

export const LIMITS = {
  q: 80,
  lambda: { min: 0.02, max: 0.06, step: 0.001 },
  thickness: { min: 10, max: 300, step: 10 },
  page: { min: 1, max: 200 },
  compare: 3,
  perPage: { grid: 24, table: 50 },
} as const;

export type ProductQuery = {
  q: string;
  categories: string[];
  applications: string[];
  fireClasses: string[];
  lambdaMax: number | null;
  thicknessMin: number | null;
  thicknessMax: number | null;
  epdOnly: boolean;
  sort: SortKey;
  view: ViewMode;
  page: number;
  perPage: number;
  compare: string[];
};

/** A parameter we could not use, so the interface can say so. */
export type ParamIssue = { param: string; value: string; reason: string };

export type ParsedQuery = { query: ProductQuery; issues: ParamIssue[] };

/** Shape Next.js hands a page for `searchParams`, once awaited. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

const SLUG = /^[a-z0-9][a-z0-9-]{0,48}$/;

function readAll(params: RawSearchParams, key: string): string[] {
  const raw = params[key];
  if (raw === undefined) return [];
  const values = Array.isArray(raw) ? raw : [raw];
  // Accept ?category=a&category=b and ?category=a,b alike.
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function readOne(params: RawSearchParams, key: string): string | undefined {
  const values = readAll(params, key);
  return values[0];
}

function parseSlugList(
  params: RawSearchParams,
  key: string,
  issues: ParamIssue[],
  allowed?: readonly string[],
): string[] {
  const out: string[] = [];
  for (const value of readAll(params, key)) {
    if (!SLUG.test(value)) {
      issues.push({ param: key, value, reason: "not a valid identifier" });
      continue;
    }
    if (allowed && !allowed.includes(value)) {
      issues.push({ param: key, value, reason: "unknown value" });
      continue;
    }
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

function parseNumber(
  params: RawSearchParams,
  key: string,
  bounds: { min: number; max: number },
  issues: ParamIssue[],
): number | null {
  const raw = readOne(params, key);
  if (raw === undefined) return null;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) {
    issues.push({ param: key, value: raw, reason: "not a number" });
    return null;
  }
  // Clamp rather than reject: someone who typed 500 mm meant "as thick as
  // you have".
  const clamped = Math.min(bounds.max, Math.max(bounds.min, value));
  if (clamped !== value) {
    issues.push({
      param: key,
      value: raw,
      reason: `outside the range ${bounds.min} to ${bounds.max}, clamped to ${clamped}`,
    });
  }
  return clamped;
}

/**
 * @param allowed Slugs that exist in the database. Passed in so this module
 * stays free of database access while still rejecting meaningless values.
 */
export function parseProductQuery(
  params: RawSearchParams,
  allowed?: { categories: readonly string[]; applications: readonly string[] },
): ParsedQuery {
  const issues: ParamIssue[] = [];

  const rawQ = readOne(params, "q") ?? "";
  let q = rawQ.replace(/\s+/g, " ").trim();
  if (q.length > LIMITS.q) {
    q = q.slice(0, LIMITS.q);
    issues.push({ param: "q", value: rawQ, reason: `truncated to ${LIMITS.q} characters` });
  }

  const categories = parseSlugList(params, "category", issues, allowed?.categories);
  const applications = parseSlugList(params, "application", issues, allowed?.applications);

  const fireClasses: string[] = [];
  for (const value of readAll(params, "fire")) {
    if (!FIRE_VALUES.includes(value)) {
      issues.push({ param: "fire", value, reason: "not a Euroclass in this catalogue" });
      continue;
    }
    if (!fireClasses.includes(value)) fireClasses.push(value);
  }

  const lambdaMax = parseNumber(params, "lambda_max", LIMITS.lambda, issues);
  let thicknessMin = parseNumber(params, "thickness_min", LIMITS.thickness, issues);
  let thicknessMax = parseNumber(params, "thickness_max", LIMITS.thickness, issues);

  if (thicknessMin !== null && thicknessMax !== null && thicknessMin > thicknessMax) {
    // A reversed range is a slip; swapping is what was meant.
    [thicknessMin, thicknessMax] = [thicknessMax, thicknessMin];
    issues.push({
      param: "thickness_min",
      value: `${thicknessMax} to ${thicknessMin}`,
      reason: "range was reversed, so the two ends were swapped",
    });
  }

  const rawEpd = readOne(params, "epd");
  const epdOnly = rawEpd === "1" || rawEpd === "true" || rawEpd === "on";
  if (rawEpd !== undefined && !epdOnly && rawEpd !== "0" && rawEpd !== "false") {
    issues.push({ param: "epd", value: rawEpd, reason: "expected 1 or 0" });
  }

  const rawSort = readOne(params, "sort");
  let sort: SortKey = q ? "relevance" : "code";
  if (rawSort !== undefined) {
    if (SORT_KEYS.includes(rawSort)) {
      sort = rawSort as SortKey;
    } else {
      issues.push({ param: "sort", value: rawSort, reason: "unknown sort order" });
    }
  }
  // Relevance is only meaningful against a search term.
  if (sort === "relevance" && !q) sort = "code";

  const rawView = readOne(params, "view");
  let view: ViewMode = "grid";
  if (rawView !== undefined) {
    if (rawView === "grid" || rawView === "table") {
      view = rawView;
    } else {
      issues.push({ param: "view", value: rawView, reason: "expected grid or table" });
    }
  }

  const rawPage = readOne(params, "page");
  let page = 1;
  if (rawPage !== undefined) {
    const parsed = Number.parseInt(rawPage, 10);
    if (!Number.isFinite(parsed)) {
      issues.push({ param: "page", value: rawPage, reason: "not a number" });
    } else {
      page = Math.min(LIMITS.page.max, Math.max(LIMITS.page.min, parsed));
      if (page !== parsed) {
        issues.push({ param: "page", value: rawPage, reason: `clamped to page ${page}` });
      }
    }
  }

  const compare: string[] = [];
  for (const value of readAll(params, "compare")) {
    if (!SLUG.test(value)) {
      issues.push({ param: "compare", value, reason: "not a valid product reference" });
      continue;
    }
    if (compare.includes(value)) continue;
    if (compare.length >= LIMITS.compare) {
      issues.push({
        param: "compare",
        value,
        reason: `only ${LIMITS.compare} products can be compared at once`,
      });
      continue;
    }
    compare.push(value);
  }

  return {
    query: {
      q,
      categories,
      applications,
      fireClasses,
      lambdaMax,
      thicknessMin,
      thicknessMax,
      epdOnly,
      sort,
      view,
      page,
      perPage: view === "table" ? LIMITS.perPage.table : LIMITS.perPage.grid,
      compare,
    },
    issues,
  };
}

/** Filters that narrow the result set, ignoring presentation-only parameters. */
export function activeFilterCount(query: ProductQuery): number {
  return (
    query.categories.length +
    query.applications.length +
    query.fireClasses.length +
    (query.lambdaMax !== null ? 1 : 0) +
    (query.thicknessMin !== null ? 1 : 0) +
    (query.thicknessMax !== null ? 1 : 0) +
    (query.epdOnly ? 1 : 0)
  );
}

export function hasAnyFilter(query: ProductQuery): boolean {
  return activeFilterCount(query) > 0 || query.q.length > 0;
}

type Overrides = Partial<Record<keyof ProductQuery, unknown>>;

/** Canonical query string: defaults omitted, so one result has one address. */
export function buildQueryString(query: ProductQuery, overrides: Overrides = {}): string {
  const next = { ...query, ...overrides } as ProductQuery;
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.categories.length) params.set("category", next.categories.join(","));
  if (next.applications.length) params.set("application", next.applications.join(","));
  if (next.fireClasses.length) params.set("fire", next.fireClasses.join(","));
  if (next.lambdaMax !== null) params.set("lambda_max", String(next.lambdaMax));
  if (next.thicknessMin !== null) params.set("thickness_min", String(next.thicknessMin));
  if (next.thicknessMax !== null) params.set("thickness_max", String(next.thicknessMax));
  if (next.epdOnly) params.set("epd", "1");
  if (next.sort !== (next.q ? "relevance" : "code")) params.set("sort", next.sort);
  if (next.view !== "grid") params.set("view", next.view);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.compare.length) params.set("compare", next.compare.join(","));

  const search = params.toString();
  return search ? `?${search}` : "";
}

export function productsHref(query: ProductQuery, overrides: Overrides = {}): string {
  // Changing a filter invalidates the page number — page 4 of a narrower
  // result is usually empty, which reads as a broken filter.
  const resetsPage = Object.keys(overrides).some(
    (key) => key !== "page" && key !== "view" && key !== "compare",
  );
  return `/products${buildQueryString(query, { ...(resetsPage ? { page: 1 } : {}), ...overrides })}`;
}

/** Add or remove one value from a multi-select filter. */
export function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
