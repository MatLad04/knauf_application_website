/**
 * The first screen, drawn rather than photographed.
 *
 * A photograph of a wall says "marketing"; the same wall in section at 1:5, on
 * a ruled sheet with every layer dimensioned and called out, says what this
 * catalogue is for. So the hero ground is a drawing sheet: a fine grid, a frame
 * with a title block, and the canonical external wall build-up cut through and
 * labelled the way a detail actually is.
 *
 * The layers stack downwards rather than across, because the hero is wide and
 * short and a horizontal build-up leaves no room for six leaders without them
 * colliding. Leader lines jog out to a label column, which is what a draughts-
 * man does with the same problem.
 *
 * Inline SVG rather than an asset: every line takes its colour from the theme
 * tokens, so it inverts with the rest of the site instead of being two files.
 * It is decorative — the headline beside it carries the meaning — so it is
 * hidden from assistive technology.
 */

/** The build-up, outermost last, at the depths the catalogue declares. */
const LAYERS = [
  { name: "Substrate", note: "Blockwork", mm: 200, fill: "coarse" },
  { name: "Adhesive", note: "KB-AD-110", mm: 10, fill: "solid" },
  { name: "Insulation", note: "KB-MW-035-140", mm: 140, fill: "fibre" },
  { name: "Base coat", note: "KB-BC-140", mm: 6, fill: "solid" },
  { name: "Mesh", note: "KB-RM-165", mm: 2, fill: "mesh" },
  { name: "Render", note: "KB-RF-015", mm: 8, fill: "stipple" },
] as const;

// Sized so the whole stack, its dimension and its labels sit clear of the
// three cards that come up over the lower third of the hero.
const SCALE = 0.92; // drawing units per millimetre
const TOP = 232;
const LEFT = 760;
const WIDTH = 330;
const LABEL_X = 1200; // where the leaders turn and the label column begins

const FILLS: Record<string, string> = {
  coarse: "url(#ds-coarse-fill)",
  fibre: "url(#ds-fibre)",
  mesh: "url(#ds-mesh)",
  stipple: "url(#ds-stipple)",
  solid: "none",
};

export default function DraftingSheet({ className = "" }: { className?: string }) {
  let cursor = TOP;
  const bands = LAYERS.map((layer) => {
    const height = layer.mm * SCALE;
    const band = { ...layer, y: cursor, height };
    cursor += height;
    return band;
  });

  const bottom = cursor;
  const totalMm = LAYERS.reduce((sum, layer) => sum + layer.mm, 0);
  const right = LEFT + WIDTH;

  // Labels are spread evenly down the column: a 2 mm layer and a 200 mm layer
  // need the same room for their name, which is the whole reason for the jog.
  const step = (bottom - TOP - 20) / (bands.length - 1);

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* Two grids: a fine one for the paper, a coarse one for the module. */}
        <pattern id="ds-fine" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        </pattern>
        <pattern id="ds-coarse" width="100" height="100" patternUnits="userSpaceOnUse">
          <path
            d="M100 0H0V100"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.5"
          />
        </pattern>

        {/* Hatches, one per material, the way a section is filled by hand. */}
        <pattern
          id="ds-fibre"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <path d="M0 4h8" stroke="currentColor" strokeWidth="0.9" opacity="0.8" />
        </pattern>
        <pattern id="ds-coarse-fill" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="5" r="1.8" fill="currentColor" opacity="0.55" />
          <circle cx="12" cy="10" r="2.6" fill="currentColor" opacity="0.45" />
          <circle cx="7" cy="13" r="1.2" fill="currentColor" opacity="0.5" />
          <circle cx="14" cy="3" r="1" fill="currentColor" opacity="0.5" />
        </pattern>
        <pattern id="ds-mesh" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M5 0H0V5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.95" />
        </pattern>
        <pattern id="ds-stipple" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.75" fill="currentColor" opacity="0.85" />
        </pattern>
      </defs>

      <g color="var(--color-rule)">
        <rect width="1600" height="900" fill="url(#ds-fine)" />
        <rect width="1600" height="900" fill="url(#ds-coarse)" />
      </g>

      {/* Sheet frame and title block. */}
      <g color="var(--color-edge)" opacity="0.7">
        <rect
          x="40"
          y="40"
          width="1520"
          height="820"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path d="M40 190h700" fill="none" stroke="currentColor" strokeWidth="1" />
      </g>

      <g
        color="var(--color-edge)"
        fill="currentColor"
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="1.4"
        className="sheet-section"
      >
        {/* The title block belongs at the foot of a sheet, but the foot of
            this one is where the three cards come up. So it reads along the
            top edge instead, above everything the page puts over it. */}
        <text x="76" y="150" opacity="0.9">
          EXTERNAL WALL — ETICS · SECTION 1:5
        </text>
        <text x="76" y="176" opacity="0.55">
          KERNBAU · λD 0.035 W/(m·K) · A1 · SHEET 01/22
        </text>
      </g>

      {/* Below `lg` the section comes off and the paper stays: at 390px the
          drawing and the headline are competing for the same 300 pixels, and
          the headline wins. */}
      <g color="var(--color-edge)" className="sheet-section">
        {/* The cut. Each layer at its declared depth, so the drawing is to
            scale against itself and the insulation is visibly the wall. */}
        {bands.map((band) => (
          <rect
            key={band.name}
            x={LEFT}
            y={band.y}
            width={WIDTH}
            height={band.height}
            fill={FILLS[band.fill]}
            stroke="currentColor"
            strokeWidth="1.2"
          />
        ))}

        {/* Leaders out to the label column. */}
        {bands.map((band, i) => {
          const mid = band.y + band.height / 2;
          const labelY = TOP + 10 + i * step;
          return (
            <g key={`${band.name}-label`}>
              <path
                d={`M${right} ${mid}H${LABEL_X - 60}L${LABEL_X} ${labelY}h26`}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.9"
                opacity="0.75"
              />
              <circle cx={right} cy={mid} r="2.6" fill="currentColor" opacity="0.9" />
              <text
                x={LABEL_X + 36}
                y={labelY - 4}
                fill="currentColor"
                fontFamily="var(--font-mono)"
                fontSize="13"
                letterSpacing="1.2"
                opacity="0.9"
              >
                {band.name.toUpperCase()}
              </text>
              <text
                x={LABEL_X + 36}
                y={labelY + 16}
                fill="currentColor"
                fontFamily="var(--font-mono)"
                fontSize="11"
                letterSpacing="0.6"
                opacity="0.55"
              >
                {band.mm} mm · {band.note}
              </text>
            </g>
          );
        })}

        {/* The overall depth, dimensioned down the left of the stack. */}
        <g opacity="0.9">
          <path d={`M${LEFT - 70} ${TOP}V${bottom}`} stroke="currentColor" strokeWidth="1" />
          <path
            d={`M${LEFT - 80} ${TOP}h20M${LEFT - 80} ${bottom}h20`}
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d={`M${LEFT - 75} ${TOP + 8}l5-8 5 8M${LEFT - 75} ${bottom - 8}l5 8 5-8`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x={LEFT - 84}
            y={(TOP + bottom) / 2}
            fill="currentColor"
            fontFamily="var(--font-mono)"
            fontSize="14"
            letterSpacing="1"
            textAnchor="middle"
            transform={`rotate(-90 ${LEFT - 84} ${(TOP + bottom) / 2})`}
          >
            {totalMm} mm
          </text>
        </g>

        {/* Section marker, where the detail is taken. */}
        <g opacity="0.75">
          <circle
            cx={LEFT - 190}
            cy={TOP + 120}
            r="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
          />
          <path
            d={`M${LEFT - 190} ${TOP + 76}v88M${LEFT - 234} ${TOP + 120}h88`}
            stroke="currentColor"
            strokeWidth="0.9"
          />
          <text
            x={LEFT - 190}
            y={TOP + 202}
            fill="currentColor"
            fontFamily="var(--font-mono)"
            fontSize="12"
            letterSpacing="1"
            textAnchor="middle"
          >
            DET. A
          </text>
        </g>
      </g>
    </svg>
  );
}
