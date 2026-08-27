/**
 * A section through the construction, one per application.
 *
 * The back of an application card carried a paragraph and a lot of nothing.
 * What belongs in that space is the thing the paragraph is about — and a
 * construction is not a stack of names, it is a geometry: a pitched roof rakes,
 * a partition is symmetrical about its studs, a floor is built up over a slab
 * and a flat roof over a deck. Drawing them all as the same rotated sandwich
 * would say the opposite of what this page exists to say.
 *
 * Every layer is numbered against the list on the front of the card, and the
 * numbers alternate above and below the drawing. Down one side they would need
 * to be as close together as the layers are, and a 1 mm membrane and a 200 mm
 * slab are one line of text each; alternating doubles the room every tick has
 * without moving it off the layer it names.
 */

const W = 400;
const H = 224;
/** The drawing sits between the two rows of ticks. */
const TOP = 46;
const BOTTOM = 168;
const LEFT = 52;
const RIGHT = 348;

const TICK_ABOVE = 22;
const TICK_BELOW = 202;
const TICK_R = 8.5;
/** Two ticks closer than this in the same row start to read as one number. */
const MIN_GAP = 30;

type Anchor = { n: number; x: number; y: number };

export default function ConstructionFigure({
  application,
  className = "",
}: {
  application: string;
  className?: string;
}) {
  const drawing = (DRAWINGS[application] ?? DRAWINGS["external-wall"])!;
  const { body, anchors, startBelow } = drawing();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={`construction ${className}`}
    >
      <Defs />
      {body}
      <Ticks anchors={anchors} startBelow={startBelow} />
    </svg>
  );
}

/**
 * The numbers, alternating rows, each on a leader to the layer it names.
 *
 * A tick starts above the point it belongs to and is then pushed along its own
 * row until it clears its neighbours, so the leader jogs rather than the number
 * landing on top of the one next to it — which is what a draughtsman does with
 * the same problem.
 */
function Ticks({ anchors, startBelow }: { anchors: Anchor[]; startBelow?: boolean }) {
  const rows: { anchor: Anchor; above: boolean; x: number }[] = anchors.map((anchor, i) => ({
    anchor,
    above: startBelow ? i % 2 === 1 : i % 2 === 0,
    x: anchor.x,
  }));

  for (const above of [true, false]) {
    const row = rows.filter((t) => t.above === above).sort((a, b) => a.x - b.x);
    // Forwards, then backwards, so a run pushed off the right edge comes back
    // rather than piling up against it.
    let previous = -Infinity;
    for (const tick of row) {
      tick.x = Math.max(tick.x, previous + MIN_GAP);
      previous = tick.x;
    }
    let next = Infinity;
    for (const tick of [...row].reverse()) {
      tick.x = Math.min(tick.x, next - MIN_GAP, W - TICK_R - 4);
      next = tick.x;
    }
    for (const tick of row) tick.x = Math.max(tick.x, TICK_R + 4);
  }

  return (
    <g className="cf-ticks">
      {rows.map(({ anchor, above, x }) => {
        const cy = above ? TICK_ABOVE : TICK_BELOW;
        const from = above ? cy + TICK_R : cy - TICK_R;
        const shoulder = above ? TOP - 12 : BOTTOM + 12;

        return (
          <g key={anchor.n}>
            <path d={`M${x} ${from}V${shoulder}L${anchor.x} ${anchor.y}`} className="cf-leader" />
            <circle cx={anchor.x} cy={anchor.y} r="1.8" className="cf-fill" />
            <circle cx={x} cy={cy} r={TICK_R} className="cf-tick-ring" />
            <text x={x} y={cy + 3.4} textAnchor="middle" className="cf-tick-text">
              {anchor.n}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Defs() {
  return (
    <defs>
      {/* Masonry and concrete: aggregate, never a hatch, so it can never be
          mistaken for one of the insulation layers. */}
      <pattern id="cf-masonry" width="13" height="13" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="1.2" fill="currentColor" opacity="0.5" />
        <circle cx="9" cy="8.5" r="1.7" fill="currentColor" opacity="0.4" />
        <circle cx="6" cy="11.5" r="0.8" fill="currentColor" opacity="0.45" />
      </pattern>
      {/* Mineral and wood fibre: raked lines. */}
      <pattern
        id="cf-fibre"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(38)"
      >
        <path d="M0 3.5h7" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      </pattern>
      {/* Wet trades: stipple. */}
      <pattern id="cf-mortar" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1.6" cy="1.6" r="0.65" fill="currentColor" opacity="0.7" />
        <circle cx="4.4" cy="4.4" r="0.6" fill="currentColor" opacity="0.7" />
      </pattern>
      {/* Timber cut across the grain. */}
      <pattern id="cf-timber" width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 2h9M0 6.5h9" stroke="currentColor" strokeWidth="0.7" opacity="0.55" />
      </pattern>
      <pattern id="cf-screed" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="6" r="0.9" fill="currentColor" opacity="0.45" />
        <circle cx="6" cy="2.5" r="0.7" fill="currentColor" opacity="0.45" />
      </pattern>
    </defs>
  );
}

/* --- Band stacks ---------------------------------------------------------- */

type Layer = { n: number; weight: number; hatch: string | null };

/**
 * Layers stacked across the drawing, outermost first. `weight` is the layer's
 * share of the depth — relative, because a drawing that shows a 1 mm membrane
 * at its true share of 400 mm shows nothing at all.
 */
function stack(layers: Layer[], axis: "y" | "x") {
  const total = layers.reduce((sum, l) => sum + l.weight, 0);
  const span = axis === "y" ? BOTTOM - TOP : RIGHT - LEFT;

  let cursor = axis === "y" ? TOP : LEFT;
  return layers.map((layer) => {
    const size = (layer.weight / total) * span;
    const at = cursor;
    cursor += size;
    return { ...layer, at, size, mid: at + size / 2 };
  });
}

type Drawn = { body: React.JSX.Element; anchors: Anchor[]; startBelow?: boolean };
type Placed = ReturnType<typeof stack>;

/** Bands running across the drawing, for anything built up off a deck. */
function horizontal(layers: Layer[], extras?: (bands: Placed) => React.JSX.Element): Drawn {
  const bands = stack(layers, "y");

  return {
    body: (
      <g className="cf">
        <g className="cf-body">
          {bands.map((band) => (
            <rect
              key={band.n}
              x={LEFT}
              y={band.at}
              width={RIGHT - LEFT}
              height={band.size}
              fill={band.hatch ? `url(#${band.hatch})` : "none"}
            />
          ))}
        </g>
        {extras?.(bands)}
      </g>
    ),
    // Spread the anchor points across the width so the leaders fan rather than
    // stacking on one edge.
    anchors: bands.map((band, i) => ({
      n: band.n,
      x: LEFT + ((i + 0.5) / bands.length) * (RIGHT - LEFT),
      y: band.mid,
    })),
  };
}

/** Bands running up the drawing, for anything cut through in plan. */
function vertical(layers: Layer[], extras?: (bands: Placed) => React.JSX.Element): Drawn {
  const bands = stack(layers, "x");

  return {
    body: (
      <g className="cf">
        <g className="cf-body">
          {bands.map((band) => (
            <rect
              key={band.n}
              x={band.at}
              y={TOP}
              width={band.size}
              height={BOTTOM - TOP}
              fill={band.hatch ? `url(#${band.hatch})` : "none"}
            />
          ))}
        </g>
        {extras?.(bands)}
      </g>
    ),
    anchors: bands.map((band, i) => ({
      n: band.n,
      x: band.mid,
      // Staggered down the band so two leaders never land on the same height.
      y: TOP + 18 + ((i % 3) * (BOTTOM - TOP - 36)) / 2,
    })),
  };
}

/* --- The five constructions ---------------------------------------------- */

function ExternalWall(): Drawn {
  const drawn = vertical(
    [
      { n: 1, weight: 46, hatch: "cf-masonry" },
      { n: 2, weight: 5, hatch: "cf-mortar" },
      { n: 3, weight: 40, hatch: "cf-fibre" },
      { n: 5, weight: 5, hatch: "cf-mortar" },
      { n: 6, weight: 2, hatch: null },
      { n: 7, weight: 5, hatch: "cf-mortar" },
    ],
    (bands) => {
      // The anchor is the one component that crosses the layers, so it is set
      // out from them: through the board and this far into what is behind it.
      const board = bands.find((b) => b.n === 3)!;
      const substrate = bands.find((b) => b.n === 1)!;
      const face = board.at + board.size;
      const tip = substrate.at + substrate.size - 26;
      const y = TOP + 62;

      return (
        <g className="cf-line">
          <path d={`M${face} ${y}H${tip}M${face} ${y - 7}v14`} />
          <path d={`M${tip} ${y - 3.5}l-8 3.5 8 3.5z`} className="cf-fill" />
          {/* At the head of the sheet, above the upper row of numbers: which
              way is out is the first thing to know about a wall in plan, and
              the numbering now runs from the bottom row up. */}
          <text x={LEFT} y={10} className="cf-note-text">
            INSIDE
          </text>
          <text x={RIGHT} y={10} textAnchor="end" className="cf-note-text">
            OUTSIDE
          </text>
        </g>
      );
    },
  );

  // The fixing is not a band, so it is anchored to itself — in the middle of
  // the board it is driven through.
  const board = drawn.anchors.find((a) => a.n === 3)!;
  drawn.anchors.splice(3, 0, { n: 4, x: board.x + 30, y: TOP + 62 });
  // Substrate first, and the substrate is the bottom of the build-up, so the
  // count starts on the lower row and alternates up from there.
  return { ...drawn, startBelow: true };
}

function FlatRoof(): Drawn {
  return horizontal([
    { n: 1, weight: 8, hatch: "cf-mortar" },
    { n: 2, weight: 42, hatch: "cf-fibre" },
    { n: 3, weight: 5, hatch: null },
    { n: 4, weight: 5, hatch: "cf-mortar" },
    { n: 5, weight: 34, hatch: "cf-masonry" },
  ]);
}

function Floor(): Drawn {
  return horizontal(
    [
      { n: 1, weight: 7, hatch: null },
      { n: 2, weight: 22, hatch: "cf-screed" },
      { n: 3, weight: 4, hatch: null },
      { n: 4, weight: 9, hatch: "cf-fibre" },
      { n: 5, weight: 28, hatch: "cf-fibre" },
      { n: 6, weight: 4, hatch: null },
      { n: 7, weight: 30, hatch: "cf-masonry" },
    ],
    // The edge strip, which is what stops a floating screed bridging to the
    // wall and undoing the impact layer.
    () => (
      <g className="cf-line">
        <path d={`M${LEFT} ${TOP}v46M${RIGHT} ${TOP}v46`} className="cf-heavy" />
      </g>
    ),
  );
}

function InternalPartition(): Drawn {
  const drawn = vertical(
    [
      { n: 1, weight: 7, hatch: "cf-mortar" },
      { n: 3, weight: 80, hatch: "cf-fibre" },
      { n: 4, weight: 7, hatch: "cf-mortar" },
    ],
    () => (
      <g className="cf-line">
        {/* Two C-studs, drawn as the sections they are. */}
        <path d={`M136 ${TOP}h22v10h-14v${BOTTOM - TOP - 20}h14v10h-22z`} />
        <path d={`M264 ${TOP}h-22v10h14v${BOTTOM - TOP - 20}h-14v10h22z`} />
      </g>
    ),
  );

  drawn.anchors.splice(1, 0, { n: 2, x: 147, y: TOP + 40 });
  return drawn;
}

/** The one that rakes. Its anchors are rotated with it. */
function PitchedRoof(): Drawn {
  const angle = -20;
  const cx = 200;
  const cy = (TOP + BOTTOM) / 2;

  const turn = (x: number, y: number) => {
    const rad = (angle * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  };

  const layers: Layer[] = [
    { n: 1, weight: 9, hatch: null },
    { n: 2, weight: 9, hatch: null },
    { n: 3, weight: 3, hatch: null },
    { n: 4, weight: 34, hatch: "cf-fibre" },
    { n: 5, weight: 3, hatch: null },
    { n: 6, weight: 12, hatch: "cf-timber" },
  ];
  const bands = stack(layers, "y");

  return {
    body: (
      <g className="cf" transform={`rotate(${angle} ${cx} ${cy})`}>
        <g className="cf-body">
          {bands.map((band) => (
            <rect
              key={band.n}
              x={LEFT}
              y={band.at}
              width={RIGHT - LEFT}
              height={band.size}
              fill={band.hatch ? `url(#${band.hatch})` : "none"}
            />
          ))}
        </g>
        {/* Battens on edge, which is what makes the drained cavity. */}
        <g className="cf-line">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={LEFT + 24 + i * 74}
              y={bands[1]!.at}
              width={11}
              height={bands[1]!.size}
            />
          ))}
        </g>
      </g>
    ),
    anchors: bands.map((band, i) => {
      const p = turn(LEFT + ((i + 0.5) / bands.length) * (RIGHT - LEFT), band.mid);
      return { n: band.n, x: p.x, y: p.y };
    }),
  };
}

const DRAWINGS: Record<string, () => Drawn> = {
  "external-wall": ExternalWall,
  "pitched-roof": PitchedRoof,
  "flat-roof": FlatRoof,
  floor: Floor,
  "internal-partition": InternalPartition,
};
