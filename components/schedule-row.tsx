"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash } from "@phosphor-icons/react";
import type { Product } from "@/lib/catalogue";
import { texture, textureCrop } from "@/lib/media";
import { lambda } from "@/lib/format";
import { coverage, m2, metres } from "@/lib/schedule";
import { MAX_QTY } from "@/lib/store";

/**
 * One line of either list.
 *
 * A row is a specification before it is a purchase, so it carries what the card
 * it came from carried — the code, the declared conductivity, the class — and
 * the quantity is the only thing added. Both pages use the same row for the
 * same reason the compare table uses one column shape: two lists of the same
 * products that looked different would read as two different catalogues.
 */
export function LineShot({ product }: { product: Product }) {
  const { src } = texture(product.textureKey);
  return (
    <div className="line-shot media tint">
      <Image
        src={src}
        alt=""
        fill
        sizes="72px"
        className="texture object-cover"
        style={textureCrop(product.slug)}
      />
    </div>
  );
}

export function LineIdent({ product }: { product: Product }) {
  return (
    <div className="line-ident min-w-0">
      <h3 className="line-name">
        <Link href={`/products/${product.slug}`} className="product-name">
          {product.name}
        </Link>
      </h3>
      <p className="mono line-meta">
        {product.code}
        <span aria-hidden="true"> · </span>
        {product.categoryName}
      </p>
      {/* An adhesive has no declared conductivity, and a row that says "n/a"
          twice is a row that has said nothing. Each pair appears only where
          there is a figure behind it. */}
      <p className="line-declared">
        {product.thermalConductivity !== null && (
          <>
            <span className="label symbol">λD</span>
            <span className="mono">{lambda(product.thermalConductivity)}</span>
          </>
        )}
        {product.reactionToFire && (
          <>
            <span className="label">Fire</span>
            <span className="mono">{product.reactionToFire}</span>
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Minus, the figure, plus — and the figure is an input, because somebody
 * ordering forty boards is not going to press a button forty times. Stepping
 * below one removes the line rather than leaving a zero on the schedule: a
 * quantity of none is not a quantity, it is a line that is not there.
 */
export function Stepper({
  qty,
  name,
  onChange,
}: {
  qty: number;
  name: string;
  onChange: (qty: number) => void;
}) {
  return (
    <div className="stepper" role="group" aria-label={`Quantity, ${name}`}>
      <button
        type="button"
        className="stepper-step"
        onClick={() => onChange(qty - 1)}
        aria-label={qty === 1 ? `Remove ${name}` : `One fewer, ${name}`}
      >
        <Minus size={13} weight="bold" aria-hidden="true" />
      </button>

      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_QTY}
        value={qty}
        aria-label={`Quantity, ${name}`}
        onChange={(event) => {
          const next = Number(event.target.value);
          // An empty field is somebody mid-edit, not a request to delete.
          if (event.target.value === "" || Number.isNaN(next)) return;
          onChange(next);
        }}
        className="stepper-figure mono"
      />

      <button
        type="button"
        className="stepper-step"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= MAX_QTY}
        aria-label={`One more, ${name}`}
      >
        <Plus size={13} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * What the quantity comes to on the wall. Where the product declares a format
 * this is arithmetic; where it does not — a bag, a pail, an anchor — the cell
 * says so rather than inventing a coverage to fill itself.
 */
export function Covers({ product, qty }: { product: Product; qty: number }) {
  const covers = coverage(product, qty);
  const figure =
    covers.areaM2 !== null
      ? m2(covers.areaM2)
      : covers.lengthM !== null
        ? metres(covers.lengthM)
        : null;

  return (
    <div className="line-covers">
      <p className="mono line-figure">{figure ?? "—"}</p>
      <p className="caption line-unit">
        {qty} {covers.noun}
        {qty === 1 ? "" : "s"}
        {figure === null && <span className="sr-only">, coverage not declared</span>}
      </p>
    </div>
  );
}

export function LineDrop({ label, onDrop }: { label: string; onDrop: () => void }) {
  return (
    <button type="button" onClick={onDrop} className="line-drop" aria-label={label}>
      <Trash size={16} aria-hidden="true" />
    </button>
  );
}
