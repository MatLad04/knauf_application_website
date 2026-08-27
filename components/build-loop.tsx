import { assess, SUBSTRATES } from "@/lib/build-up";

/**
 * A wall building itself, on a loop, changing its mind about how deep to be.
 *
 * The configurator's whole argument is that depth and U-value belong to the
 * build-up rather than to a board, and that moving one decision moves both
 * numbers. A still picture of a section cannot say that. This can: the wall
 * goes up in installation order, the board steps through three of the depths it
 * is made in, and the depth and the U-value under it change with it.
 *
 * The figures are not written into the drawing. They come from `assess`, the
 * same arithmetic the configurator itself runs, so the loop on the landing page
 * cannot advertise a number the tool would not produce.
 *
 * It is one CSS timeline and no JavaScript, and it stops on the finished wall
 * for anyone who asked for less motion.
 */

/** Drawing units per millimetre. */
const SCALE = 0.62;
const X0 = 34;
const TOP = 40;
const BOTTOM = 150;

const SUBSTRATE_MM = 200;
const ADHESIVE_MM = 10;
/** Base coat, mesh and render together, which is what goes on after the board. */
const SKIN_MM = 16;

const DEPTHS = [60, 100, 160];

export default function BuildLoop({
  thermalConductivity = 0.035,
  className = "",
}: {
  thermalConductivity?: number;
  className?: string;
}) {
  const substrate = SUBSTRATES[0]!;

  const steps = DEPTHS.map((mm, i) => ({
    i,
    mm,
    ...assess({
      substrateMm: substrate.mm,
      substrateR: substrate.r,
      thermalConductivity,
      thicknessMm: mm,
    }),
    // Where the skin sits once a board of this depth is under it.
    shift: (mm - DEPTHS[0]!) * SCALE,
  }));

  const substrateW = SUBSTRATE_MM * SCALE;
  const adhesiveW = ADHESIVE_MM * SCALE;
  const boardX = X0 + substrateW + adhesiveW;
  const skinX = boardX + DEPTHS[0]! * SCALE;
  const skinW = SKIN_MM * SCALE;

  return (
    <svg
      viewBox="0 0 380 210"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`A wall build-up assembling itself, stepping through boards of ${DEPTHS.join(", ")} millimetres.`}
      className={`build-loop ${className}`}
    >
      <defs>
        <pattern id="bl-masonry" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="1.3" fill="currentColor" opacity="0.5" />
          <circle cx="10" cy="9" r="1.9" fill="currentColor" opacity="0.4" />
          <circle cx="6.5" cy="12" r="0.8" fill="currentColor" opacity="0.45" />
        </pattern>
        <pattern
          id="bl-fibre"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(38)"
        >
          <path d="M0 4h8" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
        </pattern>
        <pattern id="bl-mortar" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.8" cy="1.8" r="0.7" fill="currentColor" opacity="0.75" />
          <circle cx="4.4" cy="4.4" r="0.6" fill="currentColor" opacity="0.75" />
        </pattern>
      </defs>

      {/* The paper it is drawn on. */}
      <g className="bl-grid">
        <path
          d={Array.from({ length: 8 }, (_, i) => `M0 ${i * 30}h380`).join("")}
          stroke="currentColor"
          strokeWidth="0.7"
          fill="none"
        />
        <path
          d={Array.from({ length: 13 }, (_, i) => `M${i * 30} 0v210`).join("")}
          stroke="currentColor"
          strokeWidth="0.7"
          fill="none"
        />
      </g>

      {/* Beat one: what is already there. */}
      <g className="bl-step" style={{ "--i": 0 } as React.CSSProperties}>
        <rect
          x={X0}
          y={TOP}
          width={substrateW}
          height={BOTTOM - TOP}
          fill="url(#bl-masonry)"
          className="bl-band"
        />
      </g>

      {/* Beat two: the adhesive it is bonded with. */}
      <g className="bl-step" style={{ "--i": 1 } as React.CSSProperties}>
        <rect
          x={X0 + substrateW}
          y={TOP}
          width={adhesiveW}
          height={BOTTOM - TOP}
          fill="url(#bl-mortar)"
          className="bl-band"
        />
      </g>

      {/* Beat three, and the decision: the board, at each depth in turn. */}
      {steps.map((step) => (
        <g key={step.mm} className="bl-board" style={{ "--n": step.i } as React.CSSProperties}>
          <rect
            x={boardX}
            y={TOP}
            width={step.mm * SCALE}
            height={BOTTOM - TOP}
            fill="url(#bl-fibre)"
            className="bl-band"
          />
        </g>
      ))}

      {/* Beat four: everything that goes on after it, riding on the board. */}
      {steps.map((step) => (
        <g
          key={`skin-${step.mm}`}
          className="bl-board"
          style={{ "--n": step.i } as React.CSSProperties}
        >
          <g transform={`translate(${step.shift} 0)`}>
            <rect
              x={skinX}
              y={TOP}
              width={skinW}
              height={BOTTOM - TOP}
              fill="url(#bl-mortar)"
              className="bl-band bl-skin"
            />
          </g>
        </g>
      ))}

      {/* The two figures the decision moved. */}
      {steps.map((step) => (
        <g
          key={`figures-${step.mm}`}
          className="bl-board bl-figures"
          style={{ "--n": step.i } as React.CSSProperties}
        >
          <g transform={`translate(${step.shift} 0)`}>
            <path
              d={`M${X0} 172H${skinX + skinW}M${X0} 166v12M${skinX + skinW} 166v12`}
              className="bl-dim"
            />
          </g>
          <text x={X0} y="196" className="bl-figure">
            {step.depthMm}
            <tspan className="bl-unit"> mm deep</tspan>
          </text>
          <text x="252" y="196" className="bl-figure">
            {step.u.toFixed(3)}
            <tspan className="bl-unit"> W/(m²K)</tspan>
          </text>
          <text x={boardX + 6} y={TOP - 12} className="bl-tag">
            {step.mm} mm board
          </text>
        </g>
      ))}
    </svg>
  );
}
