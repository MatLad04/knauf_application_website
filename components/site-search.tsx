"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr";

export type SearchRow = { label: string; count: number; href: string };
export type SearchLane = { title: string; rows: SearchRow[] };
export type SearchProduct = {
  name: string;
  code: string;
  href: string;
  image: string;
  figure: string;
  unit: string;
};

/**
 * The one search on the site, and it lives in the bar rather than on a page.
 *
 * Clicking into it opens what the catalogue has to offer before a word is
 * typed: the terms someone in this trade actually searches on the left, and
 * six products on the right — because a name in a list is a guess and a
 * photograph with a declared value on it is an answer. Typing narrows all of
 * it in place, including the products, so the panel answers the half-typed word
 * instead of waiting for the whole one.
 *
 * The form underneath is a plain GET to the catalogue: with no JavaScript this
 * is a search field that works, and the panel is simply never offered.
 */
export default function SiteSearch({
  lanes,
  shortcuts,
  suggestions,
  products,
}: {
  lanes: SearchLane[];
  shortcuts: { label: string; href: string }[];
  suggestions: string[];
  products: SearchProduct[];
}) {
  const listId = useId();
  const params = useSearchParams();
  const pathname = usePathname();
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // The bar is shared layout, so it has to answer to the URL under it: a
  // reload, a shared link or the back button all put the term back in the box.
  const q = params.get("q") ?? "";
  useEffect(() => {
    setTerm(q);
  }, [q]);

  // A navigation is an answer, so the panel has done its job.
  useEffect(() => {
    setOpen(false);
  }, [pathname, params]);

  // The bar and the panel are one surface while it is open, so the bar comes
  // up to the panel's light instead of sitting on the dimmed page behind it.
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.searchOpen = "true";
    else delete root.dataset.searchOpen;
    return () => {
      delete root.dataset.searchOpen;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onDown = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      input.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const needle = term.trim().toLowerCase();
  const hit = (text: string) => text.toLowerCase().includes(needle);

  const terms = needle ? suggestions.filter(hit) : suggestions;
  const browse = lanes
    .map((lane) => ({ ...lane, rows: needle ? lane.rows.filter((r) => hit(r.label)) : lane.rows }))
    .filter((lane) => lane.rows.length > 0);
  const shown = needle ? products.filter((p) => hit(p.name) || hit(p.code)) : products;
  const empty = terms.length === 0 && browse.length === 0 && shown.length === 0;

  return (
    <div ref={wrap} className="relative min-w-0 flex-1">
      <form action="/products" role="search" className="min-w-0">
        <label htmlFor={listId} className="sr-only">
          Search the catalogue
        </label>

        <div className="search-bar" data-open={open ? "true" : undefined}>
          {/* A real submit button rather than an icon: it gives the field a
              control that can be clicked as well as one that answers Enter. */}
          <button type="submit" className="shrink-0 rounded-full p-1 hover:text-signal">
            <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
            <span className="sr-only">Search</span>
          </button>

          <input
            id={listId}
            ref={input}
            name="q"
            type="text"
            autoComplete="off"
            value={term}
            placeholder="Search by name, code or declared value"
            aria-expanded={open}
            aria-controls={open ? `${listId}-panel` : undefined}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            className="min-w-0 flex-1 bg-transparent py-3 text-[0.9375rem] focus:outline-none placeholder:text-muted"
          />

          {term && (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                input.current?.focus();
              }}
              className="shrink-0 rounded-full p-1 text-muted hover:text-ink"
            >
              <X size={14} weight="bold" aria-hidden="true" />
              <span className="sr-only">Clear the search</span>
            </button>
          )}
        </div>
      </form>

      {open && (
        <>
          {/* The page steps back while the panel is open, so a wall of product
              names is not read against a drawing — but the bar is the one thing
              on the screen that is still live, so the scrim goes to the body
              rather than staying in the header's stacking context. Rendered
              here it would be painted over the field that opened it, which is
              exactly the control the visitor is still using. */}
          {mounted &&
            createPortal(
              <div
                className="search-scrim"
                aria-hidden="true"
                onPointerDown={() => setOpen(false)}
              />,
              document.body,
            )}

          <div id={`${listId}-panel`} className="search-panel">
            <div className="search-panel-inner">
              {empty ? (
                <p className="py-2 text-sm text-muted">
                  Nothing in the catalogue is named that. Press Enter to search every declared value
                  instead.
                </p>
              ) : (
                <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
                  {/* Left: what to type. */}
                  <div>
                    {terms.length > 0 && (
                      <>
                        <p className="lane-title">{needle ? "Matching" : "Common searches"}</p>
                        <ul className="mt-3">
                          {terms.slice(0, 7).map((suggestion) => (
                            <li key={suggestion}>
                              <Link
                                href={`/products?q=${encodeURIComponent(suggestion)}`}
                                className="search-row"
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  <MagnifyingGlass
                                    size={14}
                                    weight="bold"
                                    aria-hidden="true"
                                    className="shrink-0 text-muted"
                                  />
                                  <span className="truncate font-medium">{suggestion}</span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {/* Right: products as objects, then the three dimensions the
                      catalogue is organised by, as three columns under them. */}
                  <div className="grid gap-9">
                    {shown.length > 0 && (
                      <div>
                        <p className="lane-title">
                          {needle ? "Products matching" : "Lowest declared conductivity"}
                        </p>
                        <ul className="mt-4 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 xl:grid-cols-6">
                          {shown.slice(0, 6).map((product) => (
                            <li key={product.href}>
                              <Link href={product.href} className="tint-parent group block">
                                <div className="media tint aspect-[4/3] rounded-[0.875rem]">
                                  <Image
                                    src={product.image}
                                    alt=""
                                    fill
                                    sizes="14vw"
                                    className="texture object-cover"
                                  />
                                </div>
                                <p className="mt-2.5 line-clamp-2 text-[0.8125rem] font-medium leading-snug group-hover:text-signal">
                                  {product.name}
                                </p>
                                <p className="mono mt-1 text-[0.6875rem] text-muted">
                                  <span className="symbol">λD</span> {product.figure} ·{" "}
                                  {product.unit}
                                </p>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {browse.length > 0 && (
                      <div className="grid gap-x-12 gap-y-7 border-t rule pt-7 sm:grid-cols-3">
                        {browse.map((lane) => (
                          <div key={lane.title}>
                            <p className="lane-title">{lane.title}</p>
                            <ul className="mt-2">
                              {lane.rows.slice(0, 5).map((row) => (
                                <li key={row.href}>
                                  <Link href={row.href} className="search-row">
                                    <span className="truncate">{row.label}</span>
                                    <span className="mono shrink-0 text-xs text-muted">
                                      {row.count}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-9 flex flex-wrap items-center gap-2 border-t rule pt-5">
                <span className="label mr-1">Common requirements</span>
                {shortcuts.map((shortcut) => (
                  <Link key={shortcut.href} href={shortcut.href} className="chip">
                    <span className="symbol">{shortcut.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
