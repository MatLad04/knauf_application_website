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

      {/* The three renders, drawn as the three different materials they are.

          They were one stipple between them, which made the group that settles
          the system's fire class the one group whose choice the drawing did not
          register. Each is distinguished the way a finish schedule distinguishes
          them: by what the binder does to the surface. */}

      {/* Mineral render: cement and sand, floated. A coarse open aggregate. */}
      <pattern id="hatch-render-mineral" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2.5" r="1" className="hatch-fill" />
        <circle cx="6.5" cy="6" r="0.85" className="hatch-fill" />
        <circle cx="7" cy="1.5" r="0.5" className="hatch-fill" />
      </pattern>

      {/* Silicate render: a mineral binder, laid off as a scraped finish — so
          the grain is dragged, and the drag is the pattern. */}
      <pattern id="hatch-render-silicate" width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 2.5 H9 M0 7 H9" className="hatch-stroke" strokeWidth="0.55" />
        <circle cx="3" cy="4.75" r="0.7" className="hatch-fill" />
        <circle cx="7.5" cy="0.5" r="0.6" className="hatch-fill" />
      </pattern>

      {/* Silicone render: a polymer film over the grain, which closes the
          surface — an even, tight lattice rather than an open one. */}
      <pattern id="hatch-render-silicone" width="7" height="7" patternUnits="userSpaceOnUse">
        <circle
          cx="1.75"
          cy="1.75"
          r="0.95"
          className="hatch-stroke"
          strokeWidth="0.5"
          fill="none"
        />
        <circle
          cx="5.25"
          cy="5.25"
          r="0.95"
          className="hatch-stroke"
          strokeWidth="0.5"
          fill="none"
        />
        <circle cx="5.25" cy="1.75" r="0.4" className="hatch-fill" />
        <circle cx="1.75" cy="5.25" r="0.4" className="hatch-fill" />
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

      {/* The four substrates, drawn as four different things.

          They were one pattern between them, and three of the four are also
          200 mm deep — so choosing a different wall to fix to changed two
          numbers and nothing you could see, which made the first control on
          the page look broken. A drawing distinguishes masonry from concrete
          by how it is hatched, and so does this. */}

      {/* Dense concrete block: coursed, with the aggregate showing. */}
      <pattern id="hatch-block" width="30" height="16" patternUnits="userSpaceOnUse">
        <path d="M0 0.5 H30 M0 8.5 H30" className="hatch-stroke" strokeWidth="0.9" />
        <path d="M15 0.5 V8.5 M0 8.5 V16 M30 8.5 V16" className="hatch-stroke" strokeWidth="0.9" />
        <circle cx="6" cy="4.5" r="0.7" className="hatch-fill" />
        <circle cx="22" cy="12" r="0.6" className="hatch-fill" />
      </pattern>

      {/* Aircrete: the air is the material, so the voids are the pattern. */}
      <pattern id="hatch-aircrete" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.5" className="hatch-stroke" strokeWidth="0.7" fill="none" />
        <circle cx="8.5" cy="7.5" r="1.9" className="hatch-stroke" strokeWidth="0.7" fill="none" />
        <circle cx="8" cy="1.5" r="0.9" className="hatch-stroke" strokeWidth="0.6" fill="none" />
        <circle cx="1.5" cy="9" r="1" className="hatch-stroke" strokeWidth="0.6" fill="none" />
      </pattern>

      {/* Solid brickwork: stretcher bond, half-lapped. */}
      <pattern id="hatch-brick" width="24" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 0.5 H24 M0 6.5 H24" className="hatch-stroke" strokeWidth="0.9" />
        <path d="M12 0.5 V6.5 M0 6.5 V12 M24 6.5 V12" className="hatch-stroke" strokeWidth="0.9" />
      </pattern>

      {/* Reinforced concrete: aggregate, and the steel that makes it that. */}
      <pattern id="hatch-concrete" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="3.5" cy="4" r="1.2" className="hatch-fill" />
        <circle cx="11" cy="9.5" r="1" className="hatch-fill" />
        <circle cx="6" cy="13" r="0.7" className="hatch-fill" />
        <circle cx="13.5" cy="2" r="0.6" className="hatch-fill" />
        <path
          d="M9 3 l2.5 2 M1 10 l2 1.6 M12 13 l2.5 1.5"
          className="hatch-stroke"
          strokeWidth="0.8"
        />
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
    // One per render family, for the same reason the substrates have one each.
    "render-mineral": "hatch-render-mineral",
    "render-silicate": "hatch-render-silicate",
    "render-silicone": "hatch-render-silicone",
    reinforcement: "hatch-mesh",
    // One per substrate, so the first control on the configurator redraws the
    // wall rather than only recalculating it.
    "sub-dense-block": "hatch-block",
    "sub-aircrete": "hatch-aircrete",
    "sub-brick": "hatch-brick",
    "sub-concrete": "hatch-concrete",
  };
  return map[categorySlug] ?? "hatch-masonry";
}
