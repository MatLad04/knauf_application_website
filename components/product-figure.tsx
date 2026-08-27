/**
 * A product, drawn rather than photographed.
 *
 * Eleven photographs across seventy-four products meant a grid where six cards
 * in a row carried the same picture, and the picture was a macro shot of a
 * surface — which tells you what the material feels like and nothing about what
 * the thing is. A 45 mm partition roll and a 200 mm flat-roof slab looked
 * identical.
 *
 * So each product is drawn as the object it is, in axonometric, in the same
 * ink the rest of the site is drawn in: a slab with its cut edge showing the
 * material, a roll of mesh, a sack of powder, a pail of render, an anchor. The
 * depth of the slab is the declared thickness, so the drawing carries a real
 * value and a 60 mm board is visibly a third of a 180 mm one across the grid.
 *
 * `textureKey` already names the material for every product in the catalogue,
 * so nothing new had to be authored in the data for this to work.
 */

const W = 320;
const H = 240;

/** The near corner of the slab, and the two edges running back from it. */
const NEAR = { x: 150, y: 136 };
const LEFT = { x: 26, y: 90 };
const RIGHT = { x: 294, y: 84 };
const BACK = { x: 170, y: 36 };

/**
 * Drawn depth for a declared one. Not to a single scale — a 20 mm impact board
 * and a 200 mm roof slab drawn to the same scale leave one of them invisible —
 * but monotonic, so deeper always looks deeper.
 */
function depthFor(thicknessMm: number | null) {
  if (thicknessMm === null) return 30;
  const clamped = Math.min(220, Math.max(20, thicknessMm));
  return 22 + (clamped / 220) * 70;
}

const poly = (points: { x: number; y: number }[]) => points.map((p) => `${p.x},${p.y}`).join(" ");

export type FigureProps = {
  /** The material key every product in the catalogue already carries. */
  textureKey: string;
  /** Only read to tell a profile from the mesh it shares a category with. */
  code?: string;
  thicknessMm?: number | null;
  className?: string;
};

export default function ProductFigure({
  textureKey,
  code = "",
  thicknessMm = null,
  className = "",
}: FigureProps) {
  // Beads, rails and joint profiles sit in the reinforcement category with the
  // mesh, so they carry its material key. They are not rolls of anything.
  const Drawing = code.startsWith("KB-PF") ? Profile : (DRAWINGS[textureKey] ?? Slab);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={`product-figure ${className}`}
    >
      <Defs />
      <Drawing thicknessMm={thicknessMm} textureKey={textureKey} />
    </svg>
  );
}

/** What each material looks like where it has been cut through. */
function Defs() {
  return (
    <defs>
      {/* Stone wool: fine fibres in a loose tangle, laid roughly flat. */}
      <pattern id="pf-wool" width="26" height="12" patternUnits="userSpaceOnUse">
        <path
          d="M-2 3q6.5-4 13 0t13 0M-2 9q6.5 4 13 0t13 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.75"
        />
      </pattern>

      {/* Expanded polystyrene: fused beads, which is exactly what a cut face
          of it looks like at arm's length. */}
      <pattern id="pf-bead" width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" strokeWidth="0.9" />
        <circle cx="14" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="0.9" />
        <circle cx="3" cy="14" r="2.4" fill="none" stroke="currentColor" strokeWidth="0.9" />
        <circle cx="16" cy="2" r="2" fill="none" stroke="currentColor" strokeWidth="0.9" />
      </pattern>

      {/* Extruded polystyrene: a closed cell structure, much finer and even. */}
      <pattern id="pf-cell" width="11" height="10" patternUnits="userSpaceOnUse">
        <path
          d="M5.5 0.6l4.4 2.2v4.4L5.5 9.4 1.1 7.2V2.8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.85"
        />
      </pattern>

      {/* Wood fibre: long strands running with the board. */}
      <pattern id="pf-grain" width="24" height="7" patternUnits="userSpaceOnUse">
        <path
          d="M-2 2h11M12 2h14M-2 5.5h7M9 5.5h17"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.8"
        />
      </pattern>

      {/* The face of a board, as against its cut edge: a light tooth, not a
          hatch, because the top of a slab is a surface and not a section. */}
      <pattern id="pf-face" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="0.6" fill="currentColor" opacity="0.5" />
        <circle cx="10" cy="9" r="0.5" fill="currentColor" opacity="0.45" />
      </pattern>

      <pattern id="pf-mesh" width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M9 0H0V9" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.9" />
      </pattern>
    </defs>
  );
}

const FILL: Record<string, string> = {
  "mineral-wool": "url(#pf-wool)",
  eps: "url(#pf-bead)",
  xps: "url(#pf-cell)",
  "wood-fibre": "url(#pf-grain)",
};

type DrawingProps = { thicknessMm: number | null; textureKey: string };

/**
 * The slab: three faces, and the material shown on the two that are cut.
 *
 * The top face is the one you see on a pallet, so it gets a surface rather than
 * a section; the two near faces are the cut, so they carry the hatch. That is
 * the same rule the section drawings elsewhere on the site follow.
 */
function Slab({ thicknessMm, textureKey }: DrawingProps) {
  const d = depthFor(thicknessMm);
  const fill = FILL[textureKey] ?? "url(#pf-wool)";

  const down = (p: { x: number; y: number }) => ({ x: p.x, y: p.y + d });
  const top = [LEFT, BACK, RIGHT, NEAR];
  const left = [LEFT, NEAR, down(NEAR), down(LEFT)];
  const right = [NEAR, RIGHT, down(RIGHT), down(NEAR)];

  return (
    <g className="pf-body">
      <polygon points={poly(top)} className="pf-top" />
      <polygon points={poly(top)} fill="url(#pf-face)" className="pf-texture" />

      <polygon points={poly(left)} className="pf-side" />
      <polygon points={poly(left)} fill={fill} className="pf-texture" />

      <polygon points={poly(right)} className="pf-side pf-side-lit" />
      <polygon points={poly(right)} fill={fill} className="pf-texture" />

      <g className="pf-edge">
        <polygon points={poly(top)} />
        <polygon points={poly(left)} />
        <polygon points={poly(right)} />
      </g>
    </g>
  );
}

/** Mesh is sold on a roll, so it is drawn as one, part unrolled. */
function MeshRoll() {
  return (
    <g className="pf-body">
      {/* The sheet coming off the roll, falling away to the right. */}
      <polygon points="82,92 246,48 306,92 142,136" className="pf-top" />
      <polygon points="82,92 246,48 306,92 142,136" fill="url(#pf-mesh)" className="pf-texture" />
      <polygon points="82,92 246,48 306,92 142,136" className="pf-edge-shape" />

      {/* The roll itself: a cylinder seen end-on, with the wrap showing. */}
      <g className="pf-edge">
        <path d="M74 70h-38a22 44 0 0 0 0 88h38" className="pf-side" />
        <path d="M36 70h38M36 158h38" />
        <ellipse cx="74" cy="114" rx="22" ry="44" className="pf-top" />
        <ellipse cx="74" cy="114" rx="22" ry="44" />
        <ellipse cx="74" cy="114" rx="16" ry="32" opacity="0.45" />
        <ellipse cx="74" cy="114" rx="9" ry="18" opacity="0.7" />
      </g>
    </g>
  );
}

/**
 * Beads, rails and joint profiles are extrusions, so they are drawn as one: an
 * angle running back into the drawing with a perforated wing on each face,
 * which is what stops a rendered corner being chipped off by a wheelbarrow.
 */
function Profile() {
  return (
    <g className="pf-body">
      <g className="pf-edge">
        {/* The two wings, meeting at the arris. */}
        <polygon points="46,152 150,116 150,140 46,176" className="pf-side" />
        <polygon points="150,116 274,152 274,176 150,140" className="pf-side-lit" />
        <polygon points="46,152 150,116 274,152 150,188" className="pf-top" />

        <polygon points="46,152 150,116 150,140 46,176" />
        <polygon points="150,116 274,152 274,176 150,140" />
        <path d="M150 116v24" />

        {/* The nose of the bead, which is the part that takes the knock. */}
        <path d="M138 112q12-10 24 0" fill="none" strokeWidth="2.2" />
      </g>

      {/* Perforations, which is how the render keys through the wing. */}
      <g className="pf-texture">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <circle cx={62 + i * 20} cy={158 - i * 7} r="3" fill="currentColor" opacity="0.5" />
            <circle cx={168 + i * 22} cy={128 + i * 7} r="3" fill="currentColor" opacity="0.5" />
          </g>
        ))}
      </g>
    </g>
  );
}

/** Powders — adhesive, base coat — come in a paper sack. */
function Sack() {
  return (
    <g className="pf-body">
      <path d="M92 66q68-18 136 0v134q-68 17-136 0z" className="pf-side" />
      <path d="M92 66q68-18 136 0v134q-68 17-136 0z" fill="url(#pf-face)" className="pf-texture" />

      <g className="pf-edge">
        <path d="M92 66q68-18 136 0v134q-68 17-136 0z" />
        {/* The folded head of the sack, and the crease down the near face. */}
        <path d="M102 48q58-15 116 0l10 18q-68-19-136 0z" className="pf-top" />
        <path d="M160 60v142" opacity="0.3" />
      </g>

      {/* The label. Deliberately blank: a drawing of a bag with words on it is a
          photograph of a bag, and the product is named in type under the
          figure. */}
      <g className="pf-edge">
        <rect x="112" y="102" width="96" height="58" rx="4" className="pf-top" />
        <path d="M128 124h64M128 140h44" opacity="0.5" />
      </g>
    </g>
  );
}

/** Renders and primers are wet, so they arrive in a pail. */
function Pail() {
  return (
    <g className="pf-body">
      <path d="M88 84l16 118q56 14 112 0l16-118z" className="pf-side" />
      <path d="M88 84l16 118q56 14 112 0l16-118z" fill="url(#pf-face)" className="pf-texture" />

      <g className="pf-edge">
        <path d="M88 84l16 118q56 14 112 0l16-118z" />
        {/* The handle, over the top the way it is carried. */}
        <path d="M92 78q68-58 136 0" fill="none" />
        <ellipse cx="160" cy="84" rx="72" ry="21" className="pf-top" />
        <ellipse cx="160" cy="84" rx="72" ry="21" />
        <ellipse cx="160" cy="84" rx="56" ry="16" opacity="0.4" />
        <path d="M106 122h108" opacity="0.3" />
      </g>
    </g>
  );
}

/** An anchor is a fixing, so it is drawn in elevation with its plate on. */
function Anchor() {
  return (
    <g className="pf-body">
      <g className="pf-edge">
        {/* The washer plate, seen at a slight angle. */}
        <ellipse cx="68" cy="120" rx="14" ry="54" className="pf-top" />
        <ellipse cx="68" cy="120" rx="14" ry="54" />
        <ellipse cx="68" cy="120" rx="6" ry="22" opacity="0.6" />

        {/* The shank, ribbed, running back into the wall. */}
        <path d="M68 102h164v36H68z" className="pf-side" />
        <path d="M68 102h164v36H68z" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M${90 + i * 18} 102v36`} opacity="0.35" />
        ))}

        {/* The expansion zone and the tip. */}
        <path d="M232 102h30l20 18-20 18h-30z" className="pf-top" />
        <path d="M232 102h30l20 18-20 18h-30z" />
        <path d="M248 108l14 12-14 12" fill="none" opacity="0.5" />
      </g>
    </g>
  );
}

const DRAWINGS: Record<string, (props: DrawingProps) => React.JSX.Element> = {
  "mineral-wool": Slab,
  eps: Slab,
  xps: Slab,
  "wood-fibre": Slab,
  mesh: MeshRoll,
  cement: Sack,
  render: Pail,
  anchor: Anchor,
};
