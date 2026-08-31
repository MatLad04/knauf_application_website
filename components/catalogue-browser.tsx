"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { Funnel, X } from "@phosphor-icons/react/dist/ssr";
import { browse, type BrowseResult } from "@/app/products/actions";
import {
  activeFilterCount,
  LIMITS,
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Every request is numbered, so an answer that arrives after a newer one was
  // asked for is dropped rather than painted. Ticking three filters quickly
  // used to leave whichever query the server happened to finish last.
  const request = useRef(0);
  const rail = useRef<HTMLUListElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const results = useRef<HTMLElement>(null);
  // Bumped when the query changes from outside the form, so the inputs pick the
  // new state up; a change made *in* the form is already what the form says.
  const [formKey, setFormKey] = useState(0);
  // Below `lg` the filter panel is a sheet worked from the toolbar, and it is
  // served closed: served open it flashed over the catalogue on every load and
  // then animated itself away. A browser with no script gets the panel back as
  // a column above the results instead, from the sheet of rules under
  // `<noscript>` below — nothing there can open a sheet, so nothing there is
  // given one.
  const holdLimit = useHoldLimit();

  /**
   * A navigation to this same route, which nothing else here would notice.
   *
   * The catalogue is mounted once and keeps the query in its own state, so a
   * link that lands on `/products` with a different address — a suggestion from
   * the search panel, a door on the home page, a lane in the footer — re-renders
   * the page around it with a new set and leaves this component showing the old
   * one. The address changed, the results did not.
   *
   * So the served address is watched, and when it changes the component is put
   * back to what the server just sent. During render rather than in an effect:
   * the alternative is one paint of the wrong catalogue.
   */
  const [servedSearch, setServedSearch] = useState(initialSearch);
  if (initialSearch !== servedSearch) {
    setServedSearch(initialSearch);
    setSearch(initialSearch);
    setResult(initial);
    setPending(null);
    setFormKey((n) => n + 1);
    // Anything still in flight was asked for by the address we have just left.
    request.current += 1;
  }

  const raw = rawFromSearchParams(new URLSearchParams(search));
  const { query } = parseProductQuery(raw);

  /**
   * Back to the head of the list.
   *
   * Cards and the schedule are two readings of the same set, and the row you
   * were on in one is not the row you are on in the other — a switch made
   * halfway down the catalogue used to leave you somewhere arbitrary in a
   * layout you had not seen yet. So the switch returns to the first product,
   * stopped under the two bars that are pinned over it rather than at the top
   * of the document, which would scroll past the toolbar that was just used.
   *
   * Only ever upwards: if the head of the list is already on the screen there
   * is nothing to return to, and scrolling down to it would be a jump the
   * click did not ask for. Answers whether it moved, because a caller that
   * sends the page travelling must not also animate what is on it.
   *
   * `smooth` is off for a caller with something of its own over the screen —
   * the filter sheet on its way out — where travel nobody can see is only a
   * scroll still running when the sheet has gone.
   */
  const toResults = useCallback((smooth = true) => {
    const node = results.current;
    if (!node) return false;

    // The two bars are measured rather than read off their custom properties:
    // the properties are declared in rem and the header is as tall as its rows
    // happen to be, and being a couple of pixels out here means landing with
    // the first row half under the toolbar.
    const overhang =
      (document.querySelector("header")?.offsetHeight ?? 0) + (toolbar.current?.offsetHeight ?? 0);
    const top = Math.max(0, node.getBoundingClientRect().top + window.scrollY - overhang);

    // A couple of pixels of slack: the bars are measured to fractions, and a
    // scroll of two pixels is not a journey — it would only cost the switch
    // its animation for nothing.
    if (window.scrollY <= top + 2) return false;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
    return true;
  }, []);

  /**
   * The panel, opened and closed, and the page left exactly where it was.
   *
   * Below `lg` the panel used to be inserted into the flow above the results,
   * which pushed a screenful of products down and made the tap read as a
   * control that scrolled you back to the first row. It is a drawer over the
   * page there instead — fixed under the two pinned bars, scrolling in itself,
   * taking no room in the column — so opening and closing it moves nothing
   * underneath and there is no place to be restored to afterwards.
   *
   * Above `lg` it was never a disclosure: the panel is a column that is always
   * there, and this only records the state nothing reads.
   */
  const showPanel = (next: boolean) => setFiltersOpen(next);

  /**
   * Whether the panel is currently a sheet over the catalogue rather than a
   * column beside it — which is the same question as "is the grid being
   * rearranged where nobody can see it".
   */
  const sheeted = () => filtersOpen && !window.matchMedia("(width >= 64rem)").matches;

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

  /**
   * The address bar, on the way in, when it disagrees with what was rendered.
   *
   * Every change on this page is written with `history.pushState`, which the
   * router does not see. Coming back from the comparison page it restores its
   * own idea of `/products` — whatever it had cached before the first thing was
   * ticked — so the address is right and the page under it is a page from
   * before. Reading the address here is what makes the back button return to
   * the catalogue that was left rather than to the one first arrived at.
   *
   * A selection is not a query, so if the only difference is what is held for
   * comparison the results are already the right results and are left alone:
   * on the commonest way in — back from the comparison page — nothing is
   * fetched and nothing dims.
   */
  useEffect(() => {
    const qs = window.location.search.replace(/^\s*\?/, "");
    if (qs === initialSearch) return;

    setSearch(qs);

    if (askedFor(qs) === askedFor(initialSearch)) return;

    setFormKey((n) => n + 1);
    const id = (request.current += 1);
    setPending("filter");
    void browse(rawFromSearchParams(new URLSearchParams(qs))).then((data) => {
      if (id !== request.current) return;
      setPending(null);
      setResult(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Where you were in the list, kept for the way back.
   *
   * A browser restores a scroll position by measuring the document it has at
   * that moment, and on the way back that document is the first page of
   * results: everything "Load more" added is fetched after, so the restore is
   * clamped to a list shorter than the one that was left — 2,668 pixels down a
   * catalogue left at 3,000. Neither the browser nor the router can do better,
   * because the pages after the first were never navigations.
   *
   * So the place is remembered here and applied again once the results that
   * make the page that long have arrived, and abandoned the moment the reader
   * takes the scroll into their own hands.
   *
   * Remembered against the set rather than the address, because what is held
   * for comparison changes the address without changing a single row: ticking
   * a product and leaving straight away would otherwise be an address nothing
   * had ever been remembered for.
   */
  useEffect(() => {
    let timer = 0;

    const remember = () => {
      try {
        sessionStorage.setItem(
          SCROLL_KEY,
          JSON.stringify({ set: askedFor(window.location.search), y: window.scrollY }),
        );
      } catch {
        // A browser with storage switched off simply does not remember.
      }
    };

    // Settled rather than continuous: the position worth keeping is the one
    // scrolling stopped at. The click is caught on the way down, before it can
    // navigate, for the reader who clicks without ever coming to rest.
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(remember, 150);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", remember, true);
    window.addEventListener("pagehide", remember);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", remember, true);
      window.removeEventListener("pagehide", remember);
    };
  }, []);

  useEffect(() => {
    let saved: { set?: unknown; y?: unknown } | null = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? "null");
    } catch {
      saved = null;
    }

    const y = saved?.y;
    if (typeof y !== "number" || y <= 0) return;
    if (saved?.set !== askedFor(window.location.search)) return;

    let done = false;
    const surrender = () => {
      done = true;
    };

    // A reader who has already started moving is where they want to be.
    window.addEventListener("wheel", surrender, { passive: true, once: true });
    window.addEventListener("touchmove", surrender, { passive: true, once: true });
    window.addEventListener("keydown", surrender, { once: true });

    const until = Date.now() + 3000;
    const tick = () => {
      if (done) return;

      const reachable = document.documentElement.scrollHeight - window.innerHeight;
      if (reachable < y && Date.now() < until) {
        requestAnimationFrame(tick);
        return;
      }

      done = true;
      window.scrollTo(0, Math.min(y, Math.max(0, reachable)));
    };

    requestAnimationFrame(tick);

    return () => {
      done = true;
      window.removeEventListener("wheel", surrender);
      window.removeEventListener("touchmove", surrender);
      window.removeEventListener("keydown", surrender);
    };
  }, []);

  // A selection made on a product page is picked up on the way in. Before the
  // mirror below, which would otherwise write this page's empty selection over
  // it on the first pass and leave nothing to pick up.
  useEffect(() => {
    const stored = readCompare();
    if (stored.length === 0 || query.compare.length > 0) return;
    const next = new URLSearchParams(window.location.search);
    next.set("compare", stored.join(","));
    window.history.replaceState(null, "", `/products?${next}`);
    setSearch(next.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The comparison tray is shared with the product pages, which have no URL to
  // read it from. The URL stays the source of truth here; this only mirrors it.
  useEffect(() => {
    writeCompare(query.compare);
  }, [query.compare]);

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
  const set = (
    changes: Record<string, string | null>,
    keepPage = false,
    // Off for a change that also sends the page travelling: a view transition
    // holds a still of the old screen over the real one while it tweens, and
    // a page that scrolls under that still is the tween dragging behind.
    animate = true,
  ) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    // A different filter is a different set, so it starts at the beginning.
    if (!keepPage) next.delete("page");
    run(next, false, { animate });
  };

  /**
   * Holding a product for comparison, which is not a query.
   *
   * The set of results is exactly the same before and after: what changes is
   * which cards say they are held and what the notice above them counts. So it
   * writes the URL and re-renders off it, and never goes back to the server —
   * a round trip here dimmed the grid and ran a view transition over every card
   * on the screen to move none of them, which read as the whole page blinking
   * for the sake of one word on one card.
   */
  const hold = (compare: string | null) => {
    const next = new URLSearchParams(search);
    if (compare) next.set("compare", compare);
    else next.delete("compare");

    const qs = next.toString();
    window.history.pushState(null, "", qs ? `/products?${qs}` : "/products");
    setSearch(qs);
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
    // Ticking a box while the sheet is up rearranges a grid the sheet is
    // covering. A view transition there animates nothing anyone can see and
    // cross-fades the sheet on its way past, which is what made every tick
    // blink. The grid is simply swapped, and the transition the visitor does
    // see is the sheet leaving.
    run(next, true, { animate: !sheeted() });
  };

  const { products, total, facets, relaxations } = result;
  const chips = activeFilters(query, facets);
  const shown = products.length;
  const fade = useRailFade(rail, chips.length);

  return (
    <>
      {/* No script, no sheet. Nothing here can open one, so below `lg` the
          panel goes back to what it is above `lg`: a column of filters standing
          above the results, with the Apply button the form keeps for exactly
          this reader. */}
      <noscript>
        <style>{`@media (width < 64rem) {
          .filter-rail {
            position: static;
            visibility: visible;
            opacity: 1;
            transform: none;
            padding-inline: 0;
          }
        }`}</style>
      </noscript>

      {/* What you are looking at, and how it is presented. Sticky under the bar
          so the count stays visible while the grid scrolls. */}
      <div
        ref={toolbar}
        className="catalogue-bar sticky top-[calc(var(--header-h)_-_2px)] z-30 border-b rule bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] backdrop-blur"
      >
        <Container className="toolbar-lines py-3">
          {/* The count and the active filters share one row. On their own line
              the chips changed the height of the bar, which pushed the whole
              grid up and down every time a filter went on or off.

              The rail scrolls sideways rather than wrapping, for the same
              reason: six filters would otherwise take three lines and move the
              catalogue down the screen while you were reading it. */}
          <div className="toolbar-row min-w-0 flex-1">
            <h1 className="sr-only">Products — insulation, reinforcement and render</h1>
            <p aria-live="polite" className="shrink-0 text-sm">
              <span className="mono">{total}</span> {plural(total, "result")}
              {query.q && <span className="text-muted"> for “{query.q}”</span>}
            </p>

            {chips.length > 0 && (
              <div className="toolbar-chips flex min-w-0 items-center gap-4">
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
                        onClick={() => {
                          // Taking a filter off widens the set, and what it
                          // lets back in comes in at the top — so the answer to
                          // the click is up there rather than wherever in the
                          // narrower list the reader happened to be. Either the
                          // page travels or the cards do, never both.
                          const travelling = toResults();
                          set(chip.remove, false, !travelling);
                        }}
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
              </div>
            )}
          </div>

          <div className="toolbar-controls flex min-w-0 shrink-0 items-center gap-2">
            {/* Named only where the controls share a line with the count. On
                their own line the word is the first thing on the bar and the
                control it names is set in from the edge behind it — and what
                the listbox is for is already the first thing it says. */}
            <span className="label hidden shrink-0 lg:inline">Sort</span>
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
                  onClick={() => {
                    // Either the page travels or the cards do, never both at
                    // once: that is what made the switch drag.
                    const travelling = toResults();
                    set({ view: mode === "grid" ? null : mode }, true, !travelling);
                  }}
                  data-active={query.view === mode ? "true" : undefined}
                  aria-pressed={query.view === mode}
                  className={`control px-3 py-1.5 text-sm ${i === 0 ? "rounded-r-none" : "-ml-px rounded-l-none"}`}
                >
                  {mode === "grid" ? "Cards" : "Schedule"}
                </button>
              ))}
            </div>

            {/* The way into the filter panel, below `lg` where the panel is
                collapsed. It sits with the other controls on the results
                rather than as a bar of its own over them: sort, view and what
                is being shown at all are the same kind of decision — and it
                sits at the end of them, past the view switch, because it is
                the one that changes the set rather than the look of it.

                An icon and no word: the funnel is the whole label, and the
                three controls together already run to the edge of a phone.

                It opens the sheet and nothing else. The sheet covers this bar
                while it is up, so the way out is at the foot of the sheet: the
                count of what the filters come to, or clearing them. Both leave
                a moment where the results the filters just produced are
                seen — which the button you came in by never could. */}
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="filter-panel"
              aria-label="Show filters"
              title="Show filters"
              data-active={filtersOpen ? "true" : undefined}
              onClick={() => showPanel(true)}
              className="control shrink-0 px-3 py-1.5 text-sm lg:hidden"
            >
              <Funnel size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </div>

      {/* No padding above the columns: the rail pins to the underside of the
          toolbar, and anything above it in normal flow is a distance the rail
          has to travel before it catches. The results column carries its own
          top padding instead.

          Below `lg` the rail is not a column at all: closed it is not there,
          open it is a drawer over the page. Either way the grid is one column
          of results, so a phone never spends the rail's top padding and the
          row gap under it on nothing. */}
      <Container className="grid gap-10 pb-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        {/* The rail scrolls on its own, pinned from `lg` up and a drawer below
            it. Nine categories and six Euroclasses are taller than most
            screens, and leaving them in the page meant scrolling past the whole
            catalogue to reach the last filter — or scrolling the catalogue back
            up to change your mind. */}
        <aside
          aria-labelledby="filters-heading"
          data-open={filtersOpen ? "true" : undefined}
          className="filter-rail min-w-0 pt-6 lg:pt-7"
        >
          {/* Named on the sheet as well as on the rail: the sheet covers the
              bar that says what you are looking at, so without it the phone
              opens on a list of checkboxes with nothing over them. */}
          <h2 id="filters-heading" className="label mb-4">
            Filters
          </h2>
          <Filters
            key={formKey}
            facets={facets}
            query={query}
            onApply={applyForm}
            total={total}
            onDone={(reason) => {
              showPanel(false);
              // Only the count. That button asks for these products, and the
              // answer to it is the first of them — wherever in the old set
              // the sheet happened to be opened from. Clearing asks for
              // nothing, and puts back a catalogue the row you were reading is
              // still somewhere in, so it leaves the page where it stands.
              //
              // The jump goes under the sheet rather than after it: the sheet
              // is opaque for as long as it takes, so what is uncovered is the
              // head of the new list rather than a page still travelling
              // towards it.
              if (reason === "shown") toResults(false);
            }}
          />
        </aside>

        <section ref={results} aria-labelledby="results-heading" className="min-w-0 pt-4 lg:pt-10">
          <h2 id="results-heading" className="sr-only">
            Results
          </h2>

          {/* One product is enough to ask the question: the comparison page
              fills the other columns with the closest products approved for
              the same job, which is what the answer would have been anyway. So
              the notice says what will happen rather than asking for two more
              clicks first. */}
          {query.compare.length > 0 && (
            <div className="compare-alert">
              <div className="panel flex items-center gap-4 p-4 text-sm">
                {/* What is held reads from the left and the way on from the
                  right, with the way out past it in the corner. The two wrap
                  between themselves when the bar is too narrow to hold them
                  apart. */}
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-5 gap-y-1">
                  <p>
                    <span className="mono">{query.compare.length}</span>{" "}
                    {plural(query.compare.length, "product")} held for comparison
                  </p>
                  <Link href={`/compare?compare=${query.compare.join(",")}`} className="link">
                    {query.compare.length === 1
                      ? "Compare with the closest matches"
                      : "Compare side by side"}
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => hold(null)}
                  aria-label="Clear the comparison"
                  title="Clear the comparison"
                  className="-m-1 shrink-0 rounded-[var(--radius-control)] p-1.5 text-muted hover:text-ink"
                >
                  <X size={14} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>
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
                        hold(
                          toggleValue(query.compare, product.slug).slice(0, holdLimit).join(",") ||
                            null,
                        )
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
/**
 * What a query string actually asks the catalogue for.
 *
 * `compare` is the one parameter that selects nothing: it says which of the
 * results are being held side by side, which the server never sees. Two
 * addresses that differ only in it are the same list, scrolled to the same
 * place, showing the same rows.
 */
function askedFor(qs: string) {
  const params = new URLSearchParams(qs);
  params.delete("compare");
  params.sort();
  return params.toString();
}

const SCROLL_KEY = "kernbau-catalogue-scroll";

/**
 * How many products can be held at once, which is a question about the screen.
 *
 * Three columns of declared values is a comparison on a laptop and a squeeze on
 * a phone, where the table sets the products side by side under each
 * characteristic: two fit that pairing, three do not. So the phone holds two —
 * and it is the holding that is capped rather than the reading, because a
 * selection of three made on a laptop still has to open on a phone.
 */
function useHoldLimit() {
  const [limit, setLimit] = useState<number>(LIMITS.compare);

  useEffect(() => {
    const narrow = window.matchMedia("(width < 48rem)");
    const read = () => setLimit(narrow.matches ? 2 : LIMITS.compare);

    read();
    narrow.addEventListener("change", read);
    return () => narrow.removeEventListener("change", read);
  }, []);

  return limit;
}

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
      <p className="display t-section">No product meets all {criteria} criteria.</p>

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
