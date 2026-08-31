import type { Product } from "./catalogue";
import { RSI, RSE } from "./build-up";
import { NBSP } from "./format";

/**
 * What a quantity means.
 *
 * "Four" is not a number a specifier can check. Four *boards* of a declared
 * 1000 × 600 slab is 2.4 m² of wall, and that is a figure they can hold against
 * an elevation. So the catalogue's declared format is read back as a unit of
 * supply, and every quantity in the basket is stated twice: as a count of the
 * thing you order, and as the area or the run it covers.
 *
 * Nothing here is invented. The format is a declared field, the arithmetic is
 * two multiplications, and where a product declares no format — a bag of
 * adhesive, a pail of render, an anchor — the coverage is left blank rather
 * than guessed at. A prototype that made up a bag weight to fill a column would
 * be doing the one thing this catalogue is built not to do.
 */
export type Supply = {
  /** What one of them is: a board, a roll, a length, or an undeclared unit. */
  noun: string;
  /** Square metres one covers, where the format gives two dimensions. */
  areaM2: number | null;
  /** Metres one runs, where the format gives one. */
  lengthM: number | null;
};

const NUMBER = /\d+(?:[.,]\d+)?/g;

/** A dimension over this in metres is delivered rolled, not stacked. */
const ROLL_FROM = 2.4;

export function supply(product: Pick<Product, "formatMm">): Supply {
  const format = product.formatMm;
  if (!format) return { noun: "unit", areaM2: null, lengthM: null };

  // "1000 × 600" is millimetres; "50 m × 1.10 m" and "2.5 m" say their unit.
  const scale = /\bm\b/.test(format) ? 1 : 0.001;
  const dims = (format.match(NUMBER) ?? []).map((n) => Number(n.replace(",", ".")) * scale);

  // "Aluminium, per board thickness" — a format with no figure in it.
  if (dims.length === 0) return { noun: "unit", areaM2: null, lengthM: null };

  if (dims.length === 1) return { noun: "length", areaM2: null, lengthM: dims[0]! };

  const [a, b] = dims as [number, number];
  return {
    noun: Math.max(a, b) >= ROLL_FROM ? "roll" : "board",
    areaM2: a * b,
    lengthM: null,
  };
}

/** What one line of the schedule covers, once its quantity is applied. */
export function coverage(product: Pick<Product, "formatMm">, qty: number) {
  const { noun, areaM2, lengthM } = supply(product);
  return {
    noun,
    areaM2: areaM2 === null ? null : areaM2 * qty,
    lengthM: lengthM === null ? null : lengthM * qty,
  };
}

export const m2 = (value: number) => `${value.toFixed(1)}${NBSP}m²`;
export const metres = (value: number) => `${value.toFixed(1)}${NBSP}m`;

/**
 * The figures a merchant's counter would read off the schedule before pricing
 * it, in the order they matter: how much of the wall it covers, what the worst
 * layer in it does in a fire, and — if the insulation lines were laid up as one
 * build-up — how deep that is and what it is worth thermally.
 *
 * The last two are conditional on purpose and the interface says so. A basket
 * is a list of things bought, not a section through a wall, and adding the R of
 * two boards is only true if somebody actually stacks them. The configurator is
 * where a build-up is drawn; this is the arithmetic you can do without one.
 */
export type Schedule = {
  lines: number;
  units: number;
  areaM2: number;
  lengthM: number;
  /** Worst declared Euroclass across the lines — a system is its worst layer. */
  fire: string | null;
  epd: { declared: number; of: number };
  standards: string[];
  /** Insulation lines only, one of each, laid up. */
  stack: { layers: number; depthMm: number; r: number; u: number } | null;
};

export function schedule(entries: { product: Product; qty: number }[]): Schedule {
  let units = 0;
  let areaM2 = 0;
  let lengthM = 0;
  let declared = 0;

  let worst: Product | null = null;
  let depthMm = 0;
  let r = 0;
  let layers = 0;

  const standards = new Set<string>();

  for (const { product, qty } of entries) {
    units += qty;

    const covers = coverage(product, qty);
    areaM2 += covers.areaM2 ?? 0;
    lengthM += covers.lengthM ?? 0;

    if (product.epdAvailable) declared += 1;
    if (product.standard) standards.add(product.standard);

    // Ranked, not compared as strings: "A2-s1,d0" sorts before "A1" in an
    // alphabet and after it in a fire test.
    if (product.fireRank !== null && (worst === null || product.fireRank > worst.fireRank!)) {
      worst = product;
    }

    if (product.thicknessMm !== null && product.thermalConductivity !== null) {
      layers += 1;
      depthMm += product.thicknessMm;
      r += product.thicknessMm / 1000 / product.thermalConductivity;
    }
  }

  return {
    lines: entries.length,
    units,
    areaM2,
    lengthM,
    fire: worst?.reactionToFire ?? null,
    epd: { declared, of: entries.length },
    standards: [...standards].sort(),
    stack: layers > 0 ? { layers, depthMm, r, u: 1 / (RSI + r + RSE) } : null,
  };
}
