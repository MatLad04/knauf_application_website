"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "@phosphor-icons/react";
import type { Product } from "@/lib/catalogue";
import { plural, rValue } from "@/lib/format";
import { m2, metres, schedule } from "@/lib/schedule";
import { cart, saved, useCart, useSaved, useStoreReady } from "@/lib/store";
import { release } from "@/lib/release";
import InDev from "./in-dev";
import { Covers, LineDrop, LineIdent, LineShot, Stepper } from "./schedule-row";
import { LoadingRegion, ScheduleSkeleton } from "./skeletons";

/**
 * The basket, drawn as what it is: a materials schedule.
 *
 * The catalogue has no prices in it, and there is a reason for that rather than
 * an omission — the person who chooses a board is not the person who buys it.
 * So the column where a shop puts a line total holds the figure a specifier
 * would actually check instead: what that quantity covers, worked out from the
 * product's own declared format. Four boards is not a number anyone can verify;
 * 2.4 m² of wall is.
 *
 * The panel beside it totals the same way, and closes on a request for a
 * quotation rather than on a checkout, because a price is the one thing this
 * catalogue is not in a position to state.
 */
export default function CartView({
  catalogue,
  head,
}: {
  catalogue: Product[];
  /** The page's own heading block, which shares the list's column. */
  head: React.ReactNode;
}) {
  const lines = useCart();
  const shortlist = useSaved();
  // The basket lives in the browser, so on the server and on the first client
  // pass there is no basket to have — which is not the same as an empty one.
  // See `useStoreReady`.
  const ready = useStoreReady();

  const bySlug = new Map(catalogue.map((product) => [product.slug, product]));

  // A slug in storage that is no longer in the catalogue is dropped rather than
  // rendered as a blank row.
  const entries = lines.flatMap((line) => {
    const product = bySlug.get(line.slug);
    return product ? [{ product, qty: line.qty }] : [];
  });

  const total = schedule(entries);

  // The panel is the second column of the same grid as the heading, not of the
  // list below it: started under the heading it began a third of the way down
  // the screen and ran its own foot off the bottom.
  if (!ready) {
    return (
      <div className="schedule-grid" data-alone="true">
        <div>
          {head}
          <LoadingRegion label="Loading your basket">
            <ScheduleSkeleton rows={3} />
          </LoadingRegion>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="schedule-grid" data-alone="true">
        <div>
          {head}
          <Empty />
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-grid">
      <div>
        {head}

        <div className="plate-list" data-cells="5">
          {/* One head per control, and every one of them ranged to the same
              edge as the thing underneath it. "Drop" used to sit over a cell
              holding two controls, so the heart beside it had no name at all. */}
          <div className="line line-head" aria-hidden="true">
            <span className="label">Product</span>
            <span className="label line-cell">Quantity</span>
            <span className="label line-cell">Covers</span>
            <span className="label line-cell">Save</span>
            <span className="label line-cell">Drop</span>
          </div>

          {entries.map(({ product, qty }) => (
            <div key={product.slug} className="line">
              <div className="line-product">
                <LineShot product={product} />
                <LineIdent product={product} />
              </div>

              <div className="line-cell">
                <Stepper
                  qty={qty}
                  name={product.name}
                  onChange={(next) => cart.setQty(product.slug, next)}
                />
              </div>

              <Covers product={product} qty={qty} />

              {/* The heart is the same switch it is everywhere else on the
                  site, and nothing more: it saves the product, or takes it back
                  off the shortlist. It used to move the line — save and drop in
                  one press — which meant a filled heart could not be un-filled
                  and the only way to find out was to lose the row. The bin in
                  the column after it is the one control that removes anything. */}
              <div className="line-cell">
                <button
                  type="button"
                  onPointerUp={release}
                  onClick={() => saved.toggle(product.slug)}
                  aria-pressed={shortlist.includes(product.slug)}
                  className="line-move"
                  aria-label={
                    shortlist.includes(product.slug)
                      ? `Saved. Remove ${product.name} from the shortlist`
                      : `Save ${product.name}`
                  }
                >
                  <Heart
                    size={16}
                    weight={shortlist.includes(product.slug) ? "fill" : "bold"}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div className="line-cell">
                <LineDrop
                  label={`Remove ${product.name} from the basket`}
                  onDrop={() => cart.remove(product.slug)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="plate-foot">
          <Link href="/products" className="link text-sm">
            Back to the catalogue
          </Link>
          <button type="button" onClick={() => cart.clear()} className="act-line">
            Empty the basket
          </button>
        </div>
      </div>

      <aside className="summary" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="label summary-title">
          Schedule totals
        </h2>

        <dl className="summary-rows">
          <Row term="Lines" value={String(total.lines)} />
          <Row term="Units" value={String(total.units)} />
          {total.areaM2 > 0 && <Row term="Area covered" value={m2(total.areaM2)} />}
          {total.lengthM > 0 && <Row term="Length" value={metres(total.lengthM)} />}
          <Row
            term="Reaction to fire"
            value={total.fire ?? "—"}
            note={total.fire ? "The worst class on the schedule" : "Not declared on these lines"}
          />
          <Row
            term="With an EPD"
            value={`${total.epd.declared} of ${total.epd.of}`}
            note={
              total.standards.length > 0
                ? `Declared under ${total.standards.join(", ")}`
                : undefined
            }
          />
        </dl>

        {/* Conditional on purpose, and it says so. A basket is a list of things
            bought, not a section through a wall — adding the resistance of two
            boards is only true of somebody who actually lays them up. */}
        {total.stack && (
          <div className="summary-block">
            <p className="label">If the insulation were laid up</p>
            <dl className="summary-rows mt-3">
              <Row term="Depth" value={`${Math.round(total.stack.depthMm)} mm`} />
              <Row term="R" value={`${rValue(total.stack.r)} m²K/W`} />
              <Row term="U" value={`${total.stack.u.toFixed(3)} W/(m²K)`} />
            </dl>
            <p className="caption mt-3">
              {total.stack.layers} insulation {plural(total.stack.layers, "line")}, one of each,
              with standard surface resistances. A drawn build-up is what the{" "}
              <Link href="/configurator" className="link">
                configurator
              </Link>{" "}
              is for.
            </p>
          </div>
        )}

        <div className="summary-acts">
          {/* The one thing on this page that would need a company behind it.
              It stays where it is and says so on the spot rather than sending
              the reader to a page about why it is missing. */}
          <InDev block note="Quoting needs a distributor. This prototype has none.">
            <button type="button" aria-disabled="true" className="btn btn-primary btn-row">
              Request a quotation
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </button>
          </InDev>
        </div>

        <p className="caption summary-note">
          No prices. Kernbau declares performance; a merchant prices a delivery.
        </p>
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
      <p className="label">Nothing scheduled</p>
      <h2 className="display t-sub mt-4 max-w-[22ch]">The basket is empty</h2>
      <p className="mt-4 max-w-[52ch] text-muted">
        Every product in the catalogue has a basket button under it. What collects here is a
        schedule — quantities against declared formats — not an order.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/products" className="btn btn-primary">
          Search the catalogue
          <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
        <Link href="/favourites" className="btn btn-quiet">
          <Heart size={16} weight="bold" aria-hidden="true" />
          Your shortlist
        </Link>
      </div>
    </div>
  );
}
