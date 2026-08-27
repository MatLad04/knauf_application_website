"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { X } from "@phosphor-icons/react/dist/ssr";
import { browse, type BrowseResult } from "@/app/products/actions";
import {
  activeFilterCount,
  parseProductQuery,
  rawFromSearchParams,
  SORT_OPTIONS,
  toggleValue,
  type ProductQuery,
} from "@/lib/params";
import type { Facets } from "@/lib/catalogue";
import Filters from "./filters";
import Select from "./select";
import { readCompare, writeCompare } from "./compare-button";
import ProductCard from "./product-card";
import SpecSchedule from "./spec-schedule";
import { Container } from "./section";
import { plural } from "@/lib/format";

/**
 * The catalogue, as one mounted thing.
 *
 * Every control here used to be a link, which meant every filter was a page
 * navigation: the whole route re-rendered on the server and the rail, the
 * toolbar and every card already on the screen were replaced at once. The URL
 * is still the state — it is pushed on every change, it is shareable, and the
 * server renders the first set — but from then on the browser calls one action
 * and swaps only what came back. Nothing unmounts, so nothing flickers, and the
 * products you were already looking at stay on the screen while the next set is
 * being fetched.
 *
 * Without a script the form still submits to `/products` and every link is
 * still a link, so the whole thing degrades to the page it used to be.
 */
export default function CatalogueBrowser({
  initial,
  initialSearch,
}: {
  initial: BrowseResult;
  initialSearch: string;
}) {
  const [result, setResult] = useState(initial);
  const [search, setSearch] = useState(initialSearch);
  // What we are waiting for, not merely that we are: a filter change dims the
  // grid it is about to rearrange, while appending the next page must leave the
  // products already on the screen exactly as they are.
  const [pending, setPending] = useState<"filter" | "append" | null>(null);
  // Every request is numbered, so an answer that arrives after a newer one was
  // asked for is dropped rather than painted. Ticking three filters quickly
  // used to leave whichever query the server happened to finish last.
  const request = useRef(0);
  const rail = useRef<HTMLUListElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  // Bumped when the query changes from outside the form, so the inputs pick the
  // new state up; a change made *in* the form is already what the form says.
  const [formKey, setFormKey] = useState(0);

  const raw = rawFromSearchParams(new URLSearchParams(search));
  const { query } = parseProductQuery(raw);

  /**
   * One request, one paint.
   *
   * The URL and the chips move on the click — they are what the visitor just
   * did, and making them wait on a database is what made this feel slow. Only
   * the results wait, and when they arrive they are handed to a view transition
   * so the cards that survived the filter slide to their new places instead of
   * the whole grid being replaced under the cursor.
   */
  const run = useCallback(
    (
      next: URLSearchParams,
      fromForm: boolean,
      {
        animate = true,
        // Remounting the rail is how the form picks up a query it did not set
        // itself — a chip being removed, the back button. It is also a reset of
        // everything the rail holds that the URL does not: where it is scrolled
        // to, whether the panel is open on a phone. Asking for another page
        // changes none of the filters, so it must not touch the rail.
        resync = !fromForm,
        kind = "filter" as "filter" | "append",
      } = {},
    ) => {
      const qs = next.toString();
      const url = qs ? `/products?${qs}` : "/products";
      window.history.pushState(null, "", url);
      setSearch(qs);
      if (resync) setFormKey((n) => n + 1);

      const id = (request.current += 1);
      setPending(kind);

      void browse(rawFromSearchParams(next)).then((data) => {
        if (id !== request.current) return;
        setPending(null);
        swap(() => setResult(data), animate);
      });
    },
    [],
  );

  /**
   * How tall the toolbar is, published as a custom property.
   *
   * The filter rail pins directly under it, and "directly under it" has to be
   * an exact figure or the rail slides a little before it catches — which is
   * the one thing a pinned column must not do. The bar changes height when the
   * chips wrap on a narrow screen, so it is measured rather than guessed.
   */
  useEffect(() => {
    const node = toolbar.current;
    if (!node) return;

    const measure = () =>
      document.documentElement.style.setProperty("--toolbar-h", `${node.offsetHeight}px`);

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The comparison tray is shared with the product pages, which have no URL to
  // read it from. The URL stays the source of truth here; this only mirrors it.
  useEffect(() => {
    writeCompare(query.compare);
  }, [query.compare]);

  // A selection made on a product page is picked up on the way in.
  useEffect(() => {
    const stored = readCompare();
    if (stored.length === 0 || query.compare.length > 0) return;
    const next = new URLSearchParams(window.location.search);
    next.set("compare", stored.join(","));
    window.history.replaceState(null, "", `/products?${next}`);
    setSearch(next.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The back button is a state change like any other.
  useEffect(() => {
    const onPop = () => {
      const qs = window.location.search.replace(/^\?/, "");
      setSearch(qs);
      setFormKey((n) => n + 1);
      const id = (request.current += 1);
      setPending("filter");
      void browse(rawFromSearchParams(new URLSearchParams(qs))).then((data) => {
        if (id !== request.current) return;
        setPending(null);
        swap(() => setResult(data), true);
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /** Change one parameter and keep the rest of the URL. */
  const set = (changes: Record<string, string | null>, keepPage = false) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    // A different filter is a different set, so it starts at the beginning.
    if (!keepPage) next.delete("page");
    run(next, false);
  };

  const applyForm = (form: HTMLFormElement) => {
    const next = new URLSearchParams();
    // The search term, the view and the sort are not the rail's to change.
    for (const key of ["q", "view", "sort", "compare"]) {
      const value = new URLSearchParams(search).get(key);
      if (value) next.set(key, value);
    }
    for (const [key, value] of new FormData(form).entries()) {
      const text = String(value).trim();
      if (!text || ["q", "view", "sort", "compare"].includes(key)) continue;
      next.append(key, text);
    }
    run(next, true);
  };

  const { products, total, facets, issues, relaxations } = result;
  const chips = activeFilters(query, facets);
  const shown = products.length;
  const fade = useRailFade(rail, chips.length);

  return (
    <>
      {/* What you are looking at, and how it is presented. Sticky under the bar
          so the count stays visible while the grid scrolls. */}
      <div
        ref={toolbar}
        className="catalogue-bar sticky top-[var(--header-h)] z-30 border-b rule bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] backdrop-blur"
      >
        <Container className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-5">
          {/* The count and the active filters share one row. On their own line
              the chips changed the height of the bar, which pushed the whole
              grid up and down every time a filter went on or off.

              The rail scrolls sideways rather than wrapping, for the same
              reason: six filters would otherwise take three lines and move the
              catalogue down the screen while you were reading it. */}
          <div className="toolbar-row flex min-w-0 flex-1 items-center gap-4">
            <h1 aria-live="polite" className="shrink-0 text-sm font-normal">
              <span className="mono">{total}</span> {plural(total, "result")}
              {query.q && <span className="text-muted"> for “{query.q}”</span>}
            </h1>

            {chips.length > 0 && (
              <>
                <ul
                  ref={rail}
                  data-fade-start={fade.start ? "true" : undefined}
                  data-fade-end={fade.end ? "true" : undefined}
                  className="chip-rail"
                  aria-label="Active filters"
                >
                  {chips.map((chip) => (
                    <li key={chip.key} className="chip-slot">
                      <button
                        type="button"
                        onClick={() => set(chip.remove)}
                        className="chip"
                        data-active="true"
                      >
                        <span className="symbol">{chip.label}</span>
                        <X size={12} weight="bold" aria-hidden="true" />
                        <span className="sr-only">Remove this filter</span>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Outside the rail on purpose: the one control that undoes all
                    of this should never be the thing that scrolled out of
                    sight. */}
                <button
                  type="button"
                  onClick={() => run(new URLSearchParams(), false)}
                  className="link shrink-0 text-sm"
                >
                  Clear all
                </button>
              </>
            )}
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <span className="label hidden shrink-0 sm:inline">Sort</span>
            <Select
              label="Sort the results"
              align="end"
              value={query.sort}
              onChange={(next) => set({ sort: next })}
              options={SORT_OPTIONS.filter((option) => option.key !== "relevance" || query.q).map(
                (option) => ({ value: option.key, label: option.label }),
              )}
              className="w-[9.5rem] sm:w-[13rem]"
            />

            <div className="flex shrink-0" role="group" aria-label="View">
              {(["grid", "table"] as const).map((mode, i) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set({ view: mode === "grid" ? null : mode }, true)}
                  data-active={query.view === mode ? "true" : undefined}
                  aria-pressed={query.view === mode}
                  className={`control px-3 py-1.5 text-sm ${i === 0 ? "rounded-r-none" : "-ml-px rounded-l-none"}`}
                >
                  {mode === "grid" ? "Cards" : "Schedule"}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* No padding above the columns: the rail pins to the underside of the
          toolbar, and anything above it in normal flow is a distance the rail
          has to travel before it catches. The results column carries its own
          top padding instead. */}
      <Container className="grid gap-10 pb-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        {/* The rail scrolls on its own. Nine categories and six Euroclasses are
            taller than most screens, and pinning them to the page meant
            scrolling past the whole catalogue to reach the last filter — or
            scrolling the catalogue back up to change your mind. */}
        <aside aria-labelledby="filters-heading" className="filter-rail min-w-0 pt-10 lg:pt-7">
          <h2 id="filters-heading" className="label mb-4 hidden lg:block">
            Filters
          </h2>
          <Filters key={formKey} facets={facets} query={query} onApply={applyForm} />
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0 lg:pt-10">
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
              <button type="button" onClick={() => set({ compare: null })} className="link">
                Clear selection
              </button>
            </p>
          )}

          {/* The grid is never emptied while the next set is on its way: the
              cards keep their keys, so what is already on the screen stays on
              the screen and only what changed is patched. */}
          <div data-pending={pending === "filter" ? "true" : undefined} className="results">
            {total === 0 ? (
              <EmptyState query={query} relaxations={relaxations} onRelax={set} />
            ) : query.view === "table" ? (
              <SpecSchedule products={products} query={query} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
                {products.map((product, i) => (
                  <div
                    key={product.id}
                    className="card-slot"
                    style={{ "--vt": `product-${product.id}` } as React.CSSProperties}
                  >
                    <ProductCard
                      product={product}
                      isCompared={query.compare.includes(product.slug)}
                      onCompare={() =>
                        set({
                          compare:
                            toggleValue(query.compare, product.slug).slice(0, 3).join(",") || null,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {shown < total && (
            <div className="mt-14 flex flex-col items-center gap-5">
              <p aria-live="polite" className="text-sm">
                <span className="mono">{shown}</span>
                <span className="text-muted">/</span>
                <span className="mono">{total}</span>{" "}
                <span className="text-muted">{plural(total, "product")}</span>
              </p>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => {
                  const next = new URLSearchParams(search);
                  next.set("page", String(query.page + 1));
                  // No transition, no remount: the next page is appended under
                  // the ones already read, and the toolbar and the filter rail
                  // are not part of what changed.
                  run(next, false, { animate: false, resync: false, kind: "append" });
                }}
                className="btn btn-primary px-7 py-3.5 disabled:opacity-60"
              >
                {pending === "append" ? "Loading…" : "Load more products"}
              </button>
            </div>
          )}

          {total > 0 && shown >= total && total > query.perPage && (
            <p className="mt-14 text-center text-sm text-muted">
              <span className="mono">{total}</span> of <span className="mono">{total}</span>{" "}
              {plural(total, "product")}. That is all of them.
            </p>
          )}
        </section>
      </Container>
    </>
  );
}

/**
 * Hand a state change to a view transition where the browser has one.
 *
 * `flushSync` is what makes it work: the API snapshots the document, runs the
 * callback, and snapshots it again, so the DOM has to have actually changed by
 * the time the callback returns. A React state update on its own has not
 * happened yet at that point, and the transition captures two identical frames.
 *
 * Everywhere else — and for anyone who asked for less motion — the update is
 * simply applied, which is the same result without the tweening.
 */
function swap(apply: () => void, animate: boolean) {
  const start = (document as Document & { startViewTransition?: (cb: () => void) => unknown })
    .startViewTransition;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!animate || still || typeof start !== "function") return apply();
  start.call(document, () => flushSync(apply));
}

/**
 * Whether the filter rail has run off either end, so the fade can say so.
 *
 * A mask that is always on fades the last chip even when it is the only one,
 * which reads as a rendering fault rather than as "there is more this way".
 */
function useRailFade(rail: React.RefObject<HTMLUListElement | null>, count: number) {
  const [fade, setFade] = useState({ start: false, end: false });

  useEffect(() => {
    const node = rail.current;
    if (!node) return;

    const measure = () => {
      const slack = node.scrollWidth - node.clientWidth;
      setFade({
        start: node.scrollLeft > 2,
        end: slack > 2 && node.scrollLeft < slack - 2,
      });
    };

    measure();
    node.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [rail, count]);

  return fade;
}

type Chip = { key: string; label: string; remove: Record<string, string | null> };

/**
 * Every active filter as one removable chip. Without this the only way to undo
 * a filter is to find it again in the rail, which is the commonest complaint
 * about faceted search.
 */
function activeFilters(query: ProductQuery, facets: Facets): Chip[] {
  const chips: Chip[] = [];
  const label = (values: { value: string; label: string }[], slug: string) =>
    values.find((v) => v.value === slug)?.label ?? slug;
  const without = (values: string[], value: string) =>
    values.filter((v) => v !== value).join(",") || null;

  for (const slug of query.applications)
    chips.push({
      key: `application-${slug}`,
      label: label(facets.applications, slug),
      remove: { application: without(query.applications, slug) },
    });
  for (const slug of query.categories)
    chips.push({
      key: `category-${slug}`,
      label: label(facets.categories, slug),
      remove: { category: without(query.categories, slug) },
    });
  for (const value of query.fireClasses)
    chips.push({
      key: `fire-${value}`,
      label: `Fire ${value}`,
      remove: { fire: without(query.fireClasses, value) },
    });
  if (query.lambdaMax !== null)
    chips.push({
      key: "lambda",
      label: `λD ≤ ${query.lambdaMax.toFixed(3)}`,
      remove: { lambda_max: null },
    });
  if (query.thicknessMin !== null)
    chips.push({
      key: "thickness-min",
      label: `≥ ${query.thicknessMin} mm`,
      remove: { thickness_min: null },
    });
  if (query.thicknessMax !== null)
    chips.push({
      key: "thickness-max",
      label: `≤ ${query.thicknessMax} mm`,
      remove: { thickness_max: null },
    });
  if (query.epdOnly) chips.push({ key: "epd", label: "With an EPD", remove: { epd: null } });
  if (query.q) chips.push({ key: "q", label: `“${query.q}”`, remove: { q: null } });
  return chips;
}

function EmptyState({
  query,
  relaxations,
  onRelax,
}: {
  query: ProductQuery;
  relaxations: BrowseResult["relaxations"];
  onRelax: (changes: Record<string, string | null>) => void;
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
                <button
                  type="button"
                  onClick={() => onRelax(relaxationParams(relaxation.overrides))}
                  className="flex w-full flex-wrap items-baseline justify-between gap-2 py-3.5 text-left hover:text-signal"
                >
                  <span>{relaxation.label}</span>
                  <span className="mono text-xs text-muted">
                    {relaxation.count} {plural(relaxation.count, "product")}
                  </span>
                </button>
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

/** A relaxation is expressed against the parsed query; the URL wants its names. */
function relaxationParams(overrides: Record<string, unknown>): Record<string, string | null> {
  const map: Record<string, string> = {
    categories: "category",
    applications: "application",
    fireClasses: "fire",
    lambdaMax: "lambda_max",
    thicknessMin: "thickness_min",
    thicknessMax: "thickness_max",
    epdOnly: "epd",
  };
  const out: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(overrides)) {
    const name = map[key] ?? key;
    if (value === null || value === false || (Array.isArray(value) && value.length === 0))
      out[name] = null;
    else if (Array.isArray(value)) out[name] = value.join(",");
    else out[name] = String(value);
  }
  return out;
}
