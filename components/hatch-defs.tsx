/**
 * Hatch patterns for cross-section drawings, drawn the way a construction
 * detail draws them. A photograph shows what a material looks like; only a
 * drawing can show layer order and true thickness.
 *
 * Hatch is never the only carrier of meaning — every band is named beside it.
 */
export default function HatchDefs() {
  return (
    <defs>
      {/* Mineral wool: crossing diagonals. */}
      <pattern id="hatch-wool" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 12 L12 0" className="hatch-stroke" strokeWidth="0.8" />
        <path d="M0 0 L12 12" className="hatch-stroke" strokeWidth="0.8" />
      </pattern>

      {/* Rigid foam board: single diagonal. */}
      <pattern id="hatch-rigid" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M-1 9 L9 -1 M1 11 L11 1" className="hatch-stroke" strokeWidth="0.8" />
      </pattern>

      {/* Wood fibre: horizontal grain. */}
      <pattern id="hatch-fibre" width="12" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 3 H12" className="hatch-stroke" strokeWidth="0.8" />
      </pattern>

      {/* Cementitious mortar: stipple. */}
      <pattern id="hatch-mortar" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.8" className="hatch-fill" />
        <circle cx="6" cy="5.5" r="0.7" className="hatch-fill" />
      </pattern>

      {/* Reinforcement mesh: grid. */}
      <pattern id="hatch-mesh" width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 0 H6 M0 0 V6" className="hatch-stroke" strokeWidth="0.7" />
      </pattern>

      {/* Concrete or masonry substrate: aggregate, not hatch, so it never reads
          as one of the insulation layers. */}
      <pattern id="hatch-masonry" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="1.1" className="hatch-fill" />
        <circle cx="10.5" cy="9" r="0.9" className="hatch-fill" />
        <circle cx="7" cy="12.5" r="0.6" className="hatch-fill" />
        <path d="M8 2.5 l2.5 1.5 M1 10 l2 1.5" className="hatch-stroke" strokeWidth="0.8" />
      </pattern>
    </defs>
  );
}

export function hatchFor(categorySlug: string): string {
  const map: Record<string, string> = {
    "mineral-wool": "hatch-wool",
    "rigid-boards": "hatch-rigid",
    "wood-fibre": "hatch-fibre",
    "adhesives-base-coats": "hatch-mortar",
    "render-finishes": "hatch-mortar",
    reinforcement: "hatch-mesh",
  };
  return map[categorySlug] ?? "hatch-masonry";
}
