import HatchDefs, { hatchFor } from "./hatch-defs";

export type Layer = {
  label: string;
  productName: string | null;
  thicknessMm: number | null;
  categorySlug: string;
};

/** Thin layers have no declared thickness; these are drawing conventions. */
const NOMINAL_MM: Record<string, number> = {
  Adhesive: 10,
  "Base coat": 5,
  Reinforcement: 1,
  Primer: 1,
  Finish: 3,
  Sealing: 2,
  "Edge isolation": 8,
  "Vapour control": 1,
  Fixing: 2,
};

const WIDTH = 200;
const HEIGHT = 520;
const SUBSTRATE_MM = 120;
/** Leader gutter drawn to the right of the section, in the same units. */
const LEADER = 90;
/** A 1 mm mesh and a 3 mm render cannot both label at their true centre. */
const MIN_LABEL_GAP = 48;

/**
 * Cross-section through the system, drawn to scale from the substrate
 * outwards, with a dimension label against each band. A photograph cannot show
 * layer order or true thickness; this is the half of the visual system that can.
 */
export default function SectionDrawing({ layers }: { layers: Layer[] }) {
  const drawn = layers
    .map((layer) => ({ ...layer, mm: layer.thicknessMm ?? NOMINAL_MM[layer.label] ?? 4 }))
    // An anchor crosses the layers rather than forming one, so it is listed in
    // the build-up table but not drawn as a band.
    .filter((layer) => layer.label !== "Anchor");

  if (drawn.length === 0) return null;

  const stack: (Layer & { mm: number })[] = [
    {
      label: "Substrate",
      productName: null,
      thicknessMm: null,
      categorySlug: "substrate",
      mm: SUBSTRATE_MM,
    },
    ...drawn,
  ];

  const totalMm = stack.reduce((sum, layer) => sum + layer.mm, 0);
  const scale = HEIGHT / totalMm;

  let y = HEIGHT;
  const bands = stack.map((layer) => {
    const height = layer.mm * scale;
    y -= height;
    return { ...layer, y, height };
  });

  // Labels sit at their band's centre where there is room, and are pushed apart
  // top-down where there is not — so a leader line, not the label position,
  // carries the association.
  const topDown = [...bands].reverse();
  let previous = -Infinity;
  const placed = topDown.map((band) => {
    const centre = band.y + band.height / 2;
    const labelY = Math.max(centre, previous + MIN_LABEL_GAP);
    previous = labelY;
    return { ...band, centre, labelY };
  });

  return (
    <figure className="not-prose">
      <div className="relative flex">
        <svg
          viewBox={`0 0 ${WIDTH + LEADER} ${HEIGHT}`}
          className="w-48 sm:w-64 h-auto shrink-0"
          role="img"
          aria-label={`Cross-section through the system: ${bands
            .map((b) => b.label)
            .reverse()
            .join(", ")}, from the outside in.`}
        >
          <HatchDefs />
          <rect
            x="0"
            y="0"
            width={WIDTH}
            height={HEIGHT}
            className="fill-raised stroke-rule"
            strokeWidth="1"
          />
          {bands.map((band, i) => (
            <g key={i} className="section-layer" style={{ "--i": i } as React.CSSProperties}>
              <rect
                x="0"
                y={band.y}
                width={WIDTH}
                height={band.height}
                fill={`url(#${hatchFor(band.categorySlug)})`}
              />
              <line
                x1="0"
                y1={band.y}
                x2={WIDTH}
                y2={band.y}
                className="stroke-ink"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Leaders: band edge → label row → label. */}
          {placed.map((band, i) => (
            <polyline
              key={`leader-${i}`}
              points={`${WIDTH},${band.centre} ${WIDTH + 30},${band.labelY} ${WIDTH + LEADER},${band.labelY}`}
              fill="none"
              className="stroke-rule"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Dimension labels, positioned to match the leader rows. */}
        <div className="relative flex-1 min-w-0 -ml-2">
          {placed.map((band, i) => (
            <div
              key={i}
              style={{ top: `${(band.labelY / HEIGHT) * 100}%` }}
              className="absolute left-0 right-0 -translate-y-1/2"
            >
              <span className="label block truncate">{band.label}</span>
              <span className="mono text-[0.6875rem] text-muted">
                {band.thicknessMm
                  ? `${band.thicknessMm} mm`
                  : band.label === "Substrate"
                    ? "for context"
                    : `≈ ${band.mm} mm`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <figcaption className="caption mt-4">
        Drawn to scale. Substrate shown for context only; layers without a declared thickness are
        drawn at a nominal one.
      </figcaption>
    </figure>
  );
}
