/** Formatting for declared values. Every number in the interface is mono. */

export const NBSP = " ";

export const lambda = (v: number | null) => (v === null ? null : v.toFixed(3));

export const mm = (v: number | null) => (v === null ? null : `${v}${NBSP}mm`);

export const kgm3 = (v: number | null) => (v === null ? null : `${v}${NBSP}kg/m³`);

export const kPa = (v: number | null) => (v === null ? null : `${v}${NBSP}kPa`);

export const dB = (v: number | null) => (v === null ? null : `${v}${NBSP}dB`);

/** Thermal resistance of a layer, R = d / λ. */
export function thermalResistance(thicknessMm: number | null, lambdaValue: number | null) {
  if (!thicknessMm || !lambdaValue) return null;
  return thicknessMm / 1000 / lambdaValue;
}

export const rValue = (r: number | null) => (r === null ? null : r.toFixed(2));

export function documentLabel(kind: "dop" | "epd" | "datasheet" | "ce"): string {
  return {
    dop: "Declaration of Performance",
    epd: "Environmental Product Declaration",
    datasheet: "Technical datasheet",
    ce: "CE marking",
  }[kind];
}

export function plural(count: number, one: string, many = `${one}s`) {
  return count === 1 ? one : many;
}

/**
 * A product name in two lines: the family's root over everything that varies.
 *
 * A name like "Kernlan RD 038 Flat Roof Slab 80 mm" is three things — a brand
 * with a code, what the product is, and which one of them this is — and set on
 * one line it reads as an undifferentiated string. The root is the brand and
 * its code ("Kernlan RD 038", "Kernfix AM"); everything after it, the
 * descriptive half of the family name plus the variant, is what changes between
 * siblings. Families with no code in them ("Kerntex Profiles") keep the whole
 * name as the root and put the variant underneath.
 */
export function productNameLines(
  familyName: string,
  variantLabel: string | null,
): [root: string, rest: string] {
  const words = familyName.split(" ");
  // A code token: an all-caps abbreviation (AM, RD, XP) or its number (038).
  const isCode = (w: string) => /^[A-Z]{2,}$/.test(w) || /^\d{2,4}$/.test(w);
  let code = 0;
  for (let i = 1; i < words.length; i++) if (isCode(words[i]!)) code = i;

  const root = code ? words.slice(0, code + 1).join(" ") : familyName;
  const rest = [code ? words.slice(code + 1).join(" ") : "", variantLabel ?? ""]
    .filter(Boolean)
    .join(" ");

  return [root, rest];
}
