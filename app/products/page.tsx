import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import {
  getApplications,
  getCategories,
  getFacets,
  listProducts,
  suggestRelaxations,
  type Facets,
} from "@/lib/catalogue";
import {
  activeFilterCount,
  hasAnyFilter,
  parseProductQuery,
  productsHref,
  SORT_OPTIONS,
  toggleValue,
  type ProductQuery,
  type RawSearchParams,
} from "@/lib/params";
import Filters from "@/components/filters";
import ProductCard from "@/components/product-card";
import SearchField from "@/components/search-field";
import SpecSchedule from "@/components/spec-schedule";
import Pagination from "@/components/pagination";
import { CatalogueSkeleton } from "@/components/skeletons";
import { Container } from "@/components/section";
import { plural } from "@/lib/format";

type Props = { searchParams: Promise<RawSearchParams> };

/** Common starting points, offered only while nothing has been narrowed yet. */
const REQUIREMENTS = [
  { href: "/products?fire=A1", label: "Euroclass A1" },
  { href: "/products?lambda_max=0.032", label: "λD ≤ 0.032" },
  { href: "/products?application=floor&thickness_min=50", label: "Under screed" },
  { href: "/products?epd=1", label: "With an EPD" },
];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { query } = parseProductQuery(await searchParams);
  return {
    title: query.q ? `“${query.q}” in the catalogue` : "Catalogue",
    description:
      "Filter Kernbau insulation, reinforcement and render systems by declared performance: thermal conductivity, reaction to fire, thickness, application and EPD.",
    // Filtered views are the same products in a different order: one canonical page.
    alternates: { canonical: "/products" },
    robots: hasAnyFilter(query) ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const { query } = parseProductQuery(raw);
  const untouched = !hasAnyFilter(query);

  return (
    <>
      {/* Search first: it is the fastest route to a product, and the one thing
          on this page that should never need looking for. */}
      <section className="border-b rule" aria-labelledby="catalogue-heading">
        <Container className="py-10 sm:py-14">
          <h1 id="catalogue-heading" className="display text-[clamp(2rem,4.5vw,3.25rem)]">
            {query.q ? "Search results" : "Catalogue"}
          </h1>

          <div className="mt-7 max-w-2xl">
            <SearchField
              id="catalogue-search"
              label="Search by name, code, material or application"
              defaultValue={query.q}
              size="compact"
            />
          </div>

          {untouched && (
            <ul className="mt-5 flex flex-wrap items-center gap-2">
              <li className="label mr-1">Common requirements</li>
              {REQUIREMENTS.map((requirement) => (
                <li key={requirement.href}>
                  <Link href={requirement.href} className="chip">
                    <span className="symbol">{requirement.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {/* The heading and search render immediately; the query streams into the
          skeleton behind this boundary. The key restarts it whenever the
          filters change, so navigation shows the skeleton rather than stale
          results. */}
      <Suspense key={JSON.stringify(raw)} fallback={<CatalogueSkeleton />}>
        <Catalogue raw={raw} />
      </Suspense>
    </>
  );
}

async function Catalogue({ raw }: { raw: RawSearchParams }) {
  // Validate slugs against what actually exists, so a stale link reports the
  // bad value rather than silently returning nothing.
  const [categories, applications] = await Promise.all([getCategories(), getApplications()]);
  const { query, issues } = parseProductQuery(raw, {
    categories: categories.map((c) => c.slug),
    applications: applications.map((a) => a.slug),
  });

  const [page, facets] = await Promise.all([listProducts(query), getFacets(query)]);
  const relaxations = page.total === 0 ? await suggestRelaxations(query) : [];

  const from = (page.page - 1) * query.perPage + 1;
  const to = Math.min(page.page * query.perPage, page.total);
  const chips = activeFilters(query, facets);

  return (
    <>
      {/* What you are looking at, and how it is presented. Sticky under the
          header so the count stays visible while the grid scrolls. */}
      <div className="sticky top-16 z-30 border-b rule bg-[color-mix(in_srgb,var(--color-surface)_86%,transparent)] backdrop-blur-md">
        <Container className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="min-w-0 text-sm">
            <span className="mono">{page.total}</span> {plural(page.total, "product")}
            {page.total > 0 && (
              <span className="text-muted">
                {" "}
                showing{" "}
                <span className="mono">
                  {from}-{to}
                </span>
              </span>
            )}
          </p>

          <div className="flex min-w-0 items-center gap-2">
            <form action="/products" className="flex min-w-0 items-center gap-2">
              <PreservedInputs query={query} skip="sort" />
              <label htmlFor="sort" className="label shrink-0">
                Sort
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={query.sort}
                className="control min-w-0 px-2.5 py-1.5 text-sm"
              >
                {SORT_OPTIONS.filter((option) => option.key !== "relevance" || query.q).map(
                  (option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ),
                )}
              </select>
              <button type="submit" className="control px-2.5 py-1.5 text-sm">
                Apply
              </button>
            </form>

            <div className="flex shrink-0" role="group" aria-label="View">
              <Link
                href={productsHref(query, { view: "grid" })}
                data-active={query.view === "grid" ? "true" : undefined}
                aria-current={query.view === "grid" ? "true" : undefined}
                className="control rounded-r-none px-3 py-1.5 text-sm"
              >
                Cards
              </Link>
              <Link
                href={productsHref(query, { view: "table" })}
                data-active={query.view === "table" ? "true" : undefined}
                aria-current={query.view === "table" ? "true" : undefined}
                className="control -ml-px rounded-l-none px-3 py-1.5 text-sm"
              >
                Schedule
              </Link>
            </div>
          </div>
        </Container>

        {chips.length > 0 && (
          <Container className="pb-3">
            <ul className="flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <Link
                    href={productsHref(query, chip.remove)}
                    scroll={false}
                    className="chip"
                    data-active="true"
                  >
                    <span className="symbol">{chip.label}</span>
                    <X size={12} weight="bold" aria-hidden="true" />
                    <span className="sr-only">Remove this filter</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="link text-sm">
                  Clear all
                </Link>
              </li>
            </ul>
          </Container>
        )}
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <aside aria-labelledby="filters-heading" className="min-w-0">
          <h2 id="filters-heading" className="label mb-4 hidden lg:block">
            Filters
          </h2>
          <Filters facets={facets} query={query} />
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <h2 id="results-heading" className="sr-only">
            Results
          </h2>

          {issues.length > 0 && (
            <div className="panel mb-8 p-5 text-sm">
              <p className="label">Adjusted input</p>
              <ul className="mt-2 grid gap-1">
                {issues.map((issue, i) => (
                  <li key={i}>
                    <span className="mono">{issue.param}</span>
                    <span className="text-muted">
                      {" "}
                      = “{issue.value}”, {issue.reason}.
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {query.compare.length > 0 && (
            <p className="panel mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-sm">
              <span>
                <span className="mono">{query.compare.length}</span> selected to compare
              </span>
              <Link href={`/compare?compare=${query.compare.join(",")}`} className="link">
                Compare side by side
              </Link>
              <Link href={productsHref(query, { compare: [] })} className="link">
                Clear selection
              </Link>
            </p>
          )}

          {page.total === 0 ? (
            <EmptyState query={query} relaxations={relaxations} />
          ) : query.view === "table" ? (
            <SpecSchedule products={page.products} query={query} />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 2xl:grid-cols-4">
              {page.products.map((product, i) => (
                <div
                  key={product.id}
                  className="enter"
                  // The sweep makes it visible that the set was rebuilt after a
                  // filter changed, rather than left alone.
                  style={{ animationDelay: `${Math.min(i, 11) * 0.035}s` }}
                >
                  <ProductCard
                    product={product}
                    priority={i < 4}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    isCompared={query.compare.includes(product.slug)}
                    compareHref={productsHref(query, {
                      compare: toggleValue(query.compare, product.slug).slice(0, 3),
                    })}
                  />
                </div>
              ))}
            </div>
          )}

          <Pagination query={query} page={page.page} pageCount={page.pageCount} />
        </section>
      </Container>
    </>
  );
}

type Chip = { key: string; label: string; remove: Record<string, unknown> };

/**
 * Every active filter as one removable chip. Without this the only way to undo
 * a filter is to find it again in the rail, which is the commonest complaint
 * about faceted search.
 */
function activeFilters(query: ProductQuery, facets: Facets): Chip[] {
  const chips: Chip[] = [];
  const label = (values: { value: string; label: string }[], slug: string) =>
    values.find((v) => v.value === slug)?.label ?? slug;

  for (const slug of query.applications) {
    chips.push({
      key: `application-${slug}`,
      label: label(facets.applications, slug),
      remove: { applications: query.applications.filter((v) => v !== slug) },
    });
  }
  for (const slug of query.categories) {
    chips.push({
      key: `category-${slug}`,
      label: label(facets.categories, slug),
      remove: { categories: query.categories.filter((v) => v !== slug) },
    });
  }
  for (const value of query.fireClasses) {
    chips.push({
      key: `fire-${value}`,
      label: `Fire ${value}`,
      remove: { fireClasses: query.fireClasses.filter((v) => v !== value) },
    });
  }
  if (query.lambdaMax !== null) {
    chips.push({
      key: "lambda",
      label: `λD ≤ ${query.lambdaMax.toFixed(3)}`,
      remove: { lambdaMax: null },
    });
  }
  if (query.thicknessMin !== null) {
    chips.push({
      key: "thickness-min",
      label: `≥ ${query.thicknessMin} mm`,
      remove: { thicknessMin: null },
    });
  }
  if (query.thicknessMax !== null) {
    chips.push({
      key: "thickness-max",
      label: `≤ ${query.thicknessMax} mm`,
      remove: { thicknessMax: null },
    });
  }
  if (query.epdOnly) {
    chips.push({ key: "epd", label: "With an EPD", remove: { epdOnly: false } });
  }
  if (query.q) {
    chips.push({ key: "q", label: `“${query.q}”`, remove: { q: "" } });
  }
  return chips;
}

/** Keeps the rest of the URL state when a small form posts one parameter. */
function PreservedInputs({ query, skip }: { query: ProductQuery; skip: string }) {
  const entries: [string, string][] = [];
  if (query.q) entries.push(["q", query.q]);
  if (query.categories.length) entries.push(["category", query.categories.join(",")]);
  if (query.applications.length) entries.push(["application", query.applications.join(",")]);
  if (query.fireClasses.length) entries.push(["fire", query.fireClasses.join(",")]);
  if (query.lambdaMax !== null) entries.push(["lambda_max", String(query.lambdaMax)]);
  if (query.thicknessMin !== null) entries.push(["thickness_min", String(query.thicknessMin)]);
  if (query.thicknessMax !== null) entries.push(["thickness_max", String(query.thicknessMax)]);
  if (query.epdOnly) entries.push(["epd", "1"]);
  if (query.view !== "grid") entries.push(["view", query.view]);
  if (query.compare.length) entries.push(["compare", query.compare.join(",")]);

  return (
    <>
      {entries
        .filter(([name]) => name !== skip)
        .map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
    </>
  );
}

function EmptyState({
  query,
  relaxations,
}: {
  query: ProductQuery;
  relaxations: Awaited<ReturnType<typeof suggestRelaxations>>;
}) {
  const criteria = activeFilterCount(query) + (query.q ? 1 : 0);

  return (
    <div className="py-12">
      <p className="display text-[clamp(1.375rem,3vw,2rem)]">
        No product meets all {criteria} criteria.
      </p>

      {relaxations.length > 0 ? (
        <>
          <p className="mt-4 text-muted">Relaxing one of them returns results:</p>
          <ul className="mt-6 max-w-2xl">
            {relaxations.map((relaxation, i) => (
              <li key={i} className="border-b rule first:border-t">
                <Link
                  href={productsHref(query, relaxation.overrides)}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3.5 hover:text-signal"
                >
                  <span>{relaxation.label}</span>
                  <span className="mono text-xs text-muted">
                    {relaxation.count} {plural(relaxation.count, "product")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-muted">
          Nothing in the catalogue is close to this combination.{" "}
          <Link href="/products" className="link">
            Start again
          </Link>
          .
        </p>
      )}
    </div>
  );
}
