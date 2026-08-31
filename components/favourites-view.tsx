"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Basket } from "@phosphor-icons/react";
import type { Product } from "@/lib/catalogue";
import { lambda, plural } from "@/lib/format";
import { supply } from "@/lib/schedule";
import { cart, saved, useSaved, useStoreReady } from "@/lib/store";
import { release } from "@/lib/release";
import { LineDrop, LineIdent, LineShot } from "./schedule-row";
import { LoadingRegion, ScheduleSkeleton } from "./skeletons";

/**
 * The shortlist.
 *
 * It is the same rows as the basket, minus the quantity — because a shortlist
 * is a list of candidates and a candidate has no quantity yet. What takes the
 * quantity column's place is the thing you do next: put it on the schedule.
 *
 * The panel beside it is not a total, it is a spread. Somebody who has saved
 * five boards is holding five answers to one question, and the useful figure is
 * how far apart they are — the best and worst declared conductivity in the list,
 * and whether the fire classes in it are all the same. Reading the list across
 * is the thing this page does that a page of cards cannot.
 */
export default function FavouritesView({
  catalogue,
  head,
}: {
  catalogue: Product[];
  /** The page's own heading block, which shares the list's column. */
  head: React.ReactNode;
}) {
  const shortlist = useSaved();
  // The shortlist lives in the browser, so on the server and on the first
  // client pass there is no shortlist to have — which is not the same as an
  // empty one. See `useStoreReady`.
  const ready = useStoreReady();

  // How many were just put on the schedule, so the page can say so. Cleared on
  // a timer rather than left standing: it is a receipt, not a state.
  const [scheduled, setScheduled] = useState(0);

  useEffect(() => {
    if (scheduled === 0) return;
    const clear = setTimeout(() => setScheduled(0), 4000);
    return () => clearTimeout(clear);
  }, [scheduled]);

  const bySlug = new Map(catalogue.map((product) => [product.slug, product]));
  const products = shortlist.flatMap((slug) => {
    const product = bySlug.get(slug);
    return product ? [product] : [];
  });

  if (!ready) {
    return (
      <div className="schedule-grid" data-alone="true">
        <div>
          {head}
          <LoadingRegion label="Loading your shortlist">
            <ScheduleSkeleton rows={3} />
          </LoadingRegion>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="schedule-grid" data-alone="true">
        <div>
          {head}
          <Empty />
        </div>
      </div>
    );
  }

  const lambdas = products
    .map((product) => product.thermalConductivity)
    .filter((value): value is number => value !== null);

  const classes = [
    ...new Set(products.map((p) => p.reactionToFire).filter((c): c is string => c !== null)),
  ].sort();

  const categories = [...new Set(products.map((product) => product.categoryName))];
  const withEpd = products.filter((product) => product.epdAvailable).length;

  return (
    <div className="schedule-grid">
      <div>
        {head}

        <div className="plate-list">
          {/* One head per control, each ranged to the same edge as the thing
              underneath it. */}
          <div className="line line-head" aria-hidden="true">
            <span className="label">Product</span>
            <span className="label line-cell">Supplied as</span>
            <span className="label line-cell">Schedule it</span>
            <span className="label line-cell">Drop</span>
          </div>

          {products.map((product) => {
            const { noun } = supply(product);

            return (
              <div key={product.slug} className="line">
                <div className="line-product">
                  <LineShot product={product} />
                  <LineIdent product={product} />
                </div>

                <div className="line-cell line-supply">
                  <p className="mono line-figure">{product.formatMm ?? "—"}</p>
                  <p className="caption line-unit">
                    {noun === "unit" ? "Format not declared" : `Per ${noun}`}
                  </p>
                </div>

                <div className="line-cell">
                  <button
                    type="button"
                    onPointerUp={release}
                    onClick={() => cart.add(product.slug)}
                    className="card-act line-add"
                  >
                    <Basket size={15} weight="bold" aria-hidden="true" />
                    Basket
                    <span className="sr-only">, {product.name}</span>
                  </button>
                </div>

                <div className="line-cell">
                  <LineDrop
                    label={`Remove ${product.name} from the shortlist`}
                    onDrop={() => saved.remove(product.slug)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="plate-foot">
          <Link href="/products" className="link text-sm">
            Back to the catalogue
          </Link>
          <button type="button" onClick={() => saved.clear()} className="act-line">
            Clear the shortlist
          </button>
        </div>
      </div>

      <aside className="summary" aria-labelledby="spread-heading">
        <h2 id="spread-heading" className="label summary-title">
          What you are holding
        </h2>

        <dl className="summary-rows">
          <Row term="Saved" value={String(products.length)} />
          <Row
            term="Materials"
            value={String(categories.length)}
            note={
              categories.length > 2
                ? `${categories.slice(0, 2).join(", ")} and ${categories.length - 2} more`
                : categories.join(", ")
            }
          />
          {lambdas.length > 0 && (
            <Row
              term="λD"
              value={
                lambdas.length === 1
                  ? (lambda(lambdas[0]!) ?? "n/a")
                  : `${lambda(Math.min(...lambdas))}–${lambda(Math.max(...lambdas))}`
              }
              note={lambdas.length > 1 ? "Best and worst on the list" : undefined}
            />
          )}
          {classes.length > 0 && (
            <Row
              term="Reaction to fire"
              value={classes.join(", ")}
              note={
                classes.length > 1
                  ? "Mixed — the worst governs the system"
                  : "The same class throughout"
              }
            />
          )}
          <Row term="With an EPD" value={`${withEpd} of ${products.length}`} />
        </dl>

        <div className="summary-acts">
          {/* The one thing a shortlist is for once it has been read: putting
              what survived it onto the schedule. */}
          <button
            type="button"
            onPointerUp={release}
            onClick={() => {
              products.forEach((product) => cart.add(product.slug));
              setScheduled(products.length);
            }}
            className="btn btn-primary btn-row"
          >
            {products.length > 1 ? "Add them all to the basket" : "Add it to the basket"}
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* The button moved a figure in the bar and nothing on the page the
            reader was looking at, which reads as a button that did not work.
            This says what happened and where it happened, and takes itself away
            once it has been read. */}
        {scheduled > 0 && (
          <p className="summary-said" role="status">
            {scheduled} {plural(scheduled, "product")} on the{" "}
            <Link href="/cart" className="link">
              schedule
            </Link>
            .
          </p>
        )}
      </aside>
    </div>
  );
}

/**
 * Term against figure, on one line — unless the figure is not a figure. A list
 * of four Euroclasses set in the column a two-character value was measured for
 * pushes its own label into three lines. Past the width of "0.262 W/(m²K)" —
 * the longest thing here that is still a figure — the value stops being
 * something you scan down a column and takes the line under it instead.
 */
function Row({ term, value, note }: { term: string; value: string; note?: string }) {
  return (
    <div className="summary-row" data-stacked={value.length > 16 ? "true" : undefined}>
      <dt>
        {term}
        {note && <span className="caption summary-note-inline">{note}</span>}
      </dt>
      <dd className="mono">{value}</dd>
    </div>
  );
}

function Empty() {
  return (
    <div className="empty-plate">
      <p className="label">Nothing saved</p>
      <h2 className="display t-sub mt-4 max-w-[24ch]">The shortlist is empty</h2>
      <p className="mt-4 max-w-[52ch] text-muted">
        The heart on any product keeps it here. A shortlist is what a specification is narrowed down
        to before it is settled — a handful of candidates, held together so the declared figures can
        be read against each other.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/products" className="btn btn-primary">
          Search the catalogue
          <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
        <Link href="/products?fire=A1" className="btn btn-quiet">
          Start with Euroclass A1
        </Link>
      </div>
    </div>
  );
}
