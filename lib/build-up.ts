/**
 * The arithmetic behind the wall configurator, and the one place it lives.
 *
 * Both the configurator and the worked example on the landing page quote depth
 * and U-value for the same build-up, and a landing page that rounds differently
 * from the tool it is advertising is worse than one that says nothing. So the
 * formulas are here, they take declared values in and give figures out, and
 * neither caller does any arithmetic of its own.
 *
 * It is the right arithmetic and it is not a calculation: R is d/λ, U is the
 * reciprocal of the summed resistances, and a figure that could go on a drawing
 * comes from a full EN ISO 6946 calculation with the fixings, the air gaps and
 * the thermal bridging in it.
 */

/** Surface resistances for a vertical element, EN ISO 6946. */
export const RSI = 0.13;
export const RSE = 0.04;

/** Adhesive, base coat, mesh, primer and render together. Small, but not nil. */
export const R_FINISHES = 0.02;

/**
 * Nominal depths for the layers with no declared thickness, because they are
 * applied wet and specified by coverage. These are the depths a detail is drawn
 * at, and every interface that shows them says so.
 */
export const NOMINAL = { adhesive: 10, baseCoat: 6, mesh: 2, primer: 1, render: 8 } as const;

/** Everything the system adds over the substrate, before the board. */
export const SYSTEM_MM =
  NOMINAL.adhesive + NOMINAL.baseCoat + NOMINAL.mesh + NOMINAL.primer + NOMINAL.render;

export type Substrate = {
  id: string;
  name: string;
  note: string;
  mm: number;
  /** Thermal resistance of the existing construction, m²K/W. */
  r: number;
};

/**
 * What the system is fixed to. Existing construction is never in a product
 * catalogue, but it decides a good part of the U-value, so leaving it out would
 * make every figure wrong in the same direction.
 */
export const SUBSTRATES: Substrate[] = [
  { id: "dense-block", name: "Dense concrete block", note: "1800 kg/m³", mm: 200, r: 0.18 },
  { id: "aircrete", name: "Aircrete block", note: "600 kg/m³", mm: 200, r: 0.62 },
  { id: "brick", name: "Solid brickwork", note: "One brick thick", mm: 215, r: 0.24 },
  { id: "concrete", name: "Reinforced concrete", note: "Cast in situ", mm: 200, r: 0.11 },
];

export type Assessment = {
  depthMm: number;
  /** Thermal resistance of the board alone, m²K/W. */
  rBoard: number;
  rTotal: number;
  u: number;
};

export function assess(input: {
  substrateMm: number;
  substrateR: number;
  thermalConductivity: number;
  thicknessMm: number;
}): Assessment {
  const rBoard = input.thicknessMm / 1000 / input.thermalConductivity;
  const rTotal = RSI + input.substrateR + rBoard + R_FINISHES + RSE;
  return {
    depthMm: input.substrateMm + SYSTEM_MM + input.thicknessMm,
    rBoard,
    rTotal,
    u: 1 / rTotal,
  };
}

/** Euroclass per EN 13501-1, best first. */
const FIRE_RANK = ["A1", "A2", "B", "C", "D", "E", "F"];

/**
 * A system is only as good as the worst class in it, which is why swapping a
 * silicone render for a mineral one changes the answer for the whole wall.
 */
export function worstFire(classes: (string | null)[]): string {
  const rank = (euroclass: string) => {
    const base = euroclass.split("-")[0]!.trim();
    const found = FIRE_RANK.indexOf(base);
    return found === -1 ? FIRE_RANK.length : found;
  };
  const present = classes.filter((c): c is string => Boolean(c));
  if (present.length === 0) return "—";
  return present.reduce((worst, next) => (rank(next) > rank(worst) ? next : worst));
}

/* --- The composed build-up ------------------------------------------------
 *
 * One function, one shape, one truth.
 *
 * The drawing, the four figures, the schedule and the summary were each
 * assembling themselves from the same four choices, which is three chances for
 * them to disagree — a schedule that says 140 mm beside a section drawn at 120.
 * `compose` takes the choices and the catalogue parts and returns the whole
 * configuration; every surface in the configurator renders from what it hands
 * back and derives nothing of its own.
 */

/** One line of the schedule, one band of the section, one row of the legend. */
export type Layer = {
  id: string;
  name: string;
  product: string;
  code: string | null;
  mm: number;
  /** The category whose hatch fills the band. Null for anything not drawn. */
  hatch: string | null;
  /** The one layer the depth control moves. */
  isBoard?: boolean;
  /** Crosses the layers rather than forming one, so it adds no depth. */
  isFixing?: boolean;
};

export type Part = {
  code: string;
  familyName: string;
  reactionToFire: string | null;
} | null;

export type Choice = {
  substrate: Substrate;
  board: {
    familyName: string;
    categorySlug: string;
    textureKey: string;
    thermalConductivity: number;
    reactionToFire: string | null;
  };
  variant: { slug: string; code: string; thicknessMm: number };
  finish: (Part & { variantLabel?: string | null }) | null;
  adhesive: Part;
  baseCoat: Part;
  mesh: Part;
  primer: Part;
  anchor: Part;
};

export type Composition = Assessment & {
  layers: Layer[];
  /** Everything the system adds over what was already there. */
  addedMm: number;
  fire: string;
};

const line = (
  id: string,
  name: string,
  part: Part,
  mm: number,
  hatch: string | null,
  fallback = "Not specified",
): Layer => ({
  id,
  name,
  product: part?.familyName ?? fallback,
  code: part?.code ?? null,
  mm: part ? mm : 0,
  hatch: part ? hatch : null,
});

export function compose(choice: Choice): Composition {
  const { substrate, board, variant, finish } = choice;

  const assessment = assess({
    substrateMm: substrate.mm,
    substrateR: substrate.r,
    thermalConductivity: board.thermalConductivity,
    thicknessMm: variant.thicknessMm,
  });

  const layers: Layer[] = [
    {
      id: "substrate",
      name: "Substrate",
      product: substrate.name,
      code: null,
      mm: substrate.mm,
      // Its own, not one shared between the four: three of the substrates are
      // also 200 mm deep, so the hatch is the only thing in the drawing that
      // can say which wall you chose.
      hatch: `sub-${substrate.id}`,
    },
    line("adhesive", "Adhesive mortar", choice.adhesive, NOMINAL.adhesive, "adhesives-base-coats"),
    {
      id: "board",
      name: "Insulation board",
      product: board.familyName,
      code: variant.code,
      mm: variant.thicknessMm,
      hatch: board.categorySlug,
      isBoard: true,
    },
    {
      ...line("anchor", "Mechanical anchor", choice.anchor, 0, null, "Length to suit"),
      isFixing: true,
    },
    line("base-coat", "Base coat", choice.baseCoat, NOMINAL.baseCoat, "adhesives-base-coats"),
    line("mesh", "Reinforcement mesh", choice.mesh, NOMINAL.mesh, "reinforcement"),
    line("primer", "Primer", choice.primer, NOMINAL.primer, "adhesives-base-coats"),
    line("render", "Thin-coat render", finish, NOMINAL.render, "render-finishes"),
  ];

  return {
    ...assessment,
    layers,
    addedMm: variant.thicknessMm + SYSTEM_MM,
    // A system is only as good as the worst class in it, and the three things
    // that decide it are the board, the mesh and what goes on the front.
    fire: worstFire([
      board.reactionToFire,
      finish?.reactionToFire ?? null,
      choice.mesh?.reactionToFire ?? null,
    ]),
  };
}
