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
