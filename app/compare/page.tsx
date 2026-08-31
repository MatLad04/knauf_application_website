import type React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAlternatives, getProductsBySlugs, type Product } from "@/lib/catalogue";
import { parseProductQuery, type RawSearchParams } from "@/lib/params";
import { texture, textureCrop } from "@/lib/media";
import { lambda, rValue, thermalResistance } from "@/lib/format";
import { Container } from "@/components/section";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "Compare",
  description: "Up to three Kernbau products side by side, declared value against declared value.",
  robots: { index: false, follow: true },
};

type Row = { label: string; unit?: string; value: (product: Product) => string | number | null };

const ROWS: Row[] = [
  { label: "Code", value: (p) => p.code },
  { label: "Category", value: (p) => p.categoryName },
  { label: "Standard", value: (p) => p.standard },
  {
    label: "Thermal conductivity λD",
    unit: "W/(m·K)",
    value: (p) => lambda(p.thermalConductivity),
  },
  { label: "Reaction to fire", unit: "EN 13501-1", value: (p) => p.reactionToFire },
  { label: "Thickness", unit: "mm", value: (p) => p.thicknessMm },
  {
    label: "Thermal resistance R",
    unit: "m²K/W",
    value: (p) => rValue(thermalResistance(p.thicknessMm, p.thermalConductivity)),
  },
  { label: "Density", unit: "kg/m³", value: (p) => p.densityKgm3 },
  { label: "Compressive strength", unit: "kPa", value: (p) => p.compressiveStrengthKpa },
  { label: "Vapour resistance μ", value: (p) => p.vapourResistanceMu },
  { label: "Sound reduction Rw", unit: "dB", value: (p) => p.acousticRwDb },
  { label: "EPD available", value: (p) => (p.epdAvailable ? "Yes" : "No") },
];

/**
 * Two suggestions, from two different families where the catalogue has them.
 *
 * The alternatives come back closest-first, and the closest two are often the
 * same slab at two thicknesses — which compares a product against itself. A
 * family is taken once, and the list is only doubled back on if that leaves
 * fewer than two columns to fill.
 */
function pickTwo(alternatives: Product[]): Product[] {
  const families = new Set<string>();
  const spread: Product[] = [];

  for (const product of alternatives) {
    if (families.has(product.family)) continue;
    families.add(product.family);
    spread.push(product);
  }

  return [...spread, ...alternatives.filter((p) => !spread.includes(p))].slice(0, 2);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { query, issues } = parseProductQuery(await searchParams);
  const picked = await getProductsBySlugs(query.compare);

  const missing = query.compare.length - picked.length;

  /**
   * A comparison of one is not a comparison.
   *
   * Someone who picked a single product has still asked a question — "is this
   * the right one?" — and the answer is the products it would have been chosen
   * against: a different family approved for the same application, ordered by
   * how close its declared conductivity and thickness are to this one's. So
   * the table fills its own remaining columns rather than sending them back to
   * the catalogue to tick two more boxes.
   *
   * They are marked as suggestions in the head of each column, because a
   * column nobody chose must never read as one they did.
   */
  const alone = picked.length === 1 ? picked[0] : undefined;
  const suggested = alone ? pickTwo(await getAlternatives(alone)) : [];
  const products = [...picked, ...suggested];

  if (products.length === 0) {
    return (
      <Container className="py-24">
        <h1 className="display t-page max-w-2xl">Nothing to compare yet</h1>
        <p className="mt-5 max-w-[58ch] text-muted">
          Pick up to three products in the catalogue and they line up here, declared value against
          declared value.
        </p>
        <Link href="/products" className="btn btn-primary mt-8">
          Search the catalogue
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="display t-page">
        {products.length} {plural(products.length, "product")} side by side
      </h1>

      {suggested.length > 0 && (
        <p className="mt-5 max-w-[62ch] text-muted">
          You picked one product, so{" "}
          {suggested.length === 1 ? "the second column is" : "the other two columns are"} filled in:
          the closest the catalogue has for the same application, nearest on declared conductivity
          and thickness, each from a different family. Pick your own in the{" "}
          <Link href="/products" className="link">
            catalogue
          </Link>{" "}
          to replace {suggested.length === 1 ? "it" : "them"}.
        </p>
      )}

      {(missing > 0 || issues.length > 0) && (
        <p className="panel mt-6 p-4 text-sm text-muted">
          {missing > 0 && `${missing} of the requested products is no longer in the catalogue. `}
          {issues.length > 0 && "Some parameters in the link were ignored."}
        </p>
      )}

      <div className="panel compare-plate mt-10">
        <table
          className="compare-table w-full border-collapse"
          style={{ "--columns": products.length } as React.CSSProperties}
        >
          <caption className="sr-only">Declared performance compared</caption>
          <thead>
            <tr>
              <th scope="col" className="compare-term compare-head text-left align-bottom">
                <span className="label">Property</span>
              </th>
              {products.map((product, i) => {
                return (
                  <th key={product.id} scope="col" className="compare-cell text-left align-top">
                    {/* The specimen, and under it the name of what it is —
                        every column read the same way down, so the three names
                        line up as one row.

                        A column nobody chose says so on the photograph rather
                        than in a line of its own, because a line only two of
                        the three columns carry knocks their names out of step
                        with the first. */}
                    <div className="compare-ident">
                      <span className="media compare-shot block aspect-square w-full">
                        <Image
                          src={texture(product.textureKey).src}
                          alt=""
                          fill
                          sizes="12rem"
                          className="texture object-cover"
                          style={textureCrop(product.slug)}
                        />
                        {i >= picked.length && <span className="compare-flag">Suggested</span>}
                      </span>
                      <Link
                        href={`/products/${product.slug}`}
                        className="link compare-name font-normal"
                      >
                        {product.name}
                      </Link>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="mono">
            {ROWS.map((row) => {
              const values = products.map((product) => row.value(product));
              // Only mark a difference when there is more than one product to differ from.
              const differs = products.length > 1 && new Set(values.map(String)).size > 1;

              return (
                <tr key={row.label} className="compare-row">
                  <th scope="row" className="compare-term text-left align-top font-sans">
                    {row.label}
                    {row.unit && <span className="caption compare-unit">{row.unit}</span>}
                  </th>
                  {values.map((value, i) => (
                    <td
                      key={i}
                      className={`compare-cell align-top ${differs ? "text-ink" : "text-muted"}`}
                    >
                      {value ?? <span className="font-sans">not declared</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="caption mt-4">Rows where the products differ are set in full contrast.</p>

      <p className="mt-10">
        <Link href="/products" className="link">
          Back to the results
        </Link>
      </p>
    </Container>
  );
}
