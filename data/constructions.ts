/**
 * The five constructions, layer by layer, as the explorer draws them.
 *
 * The catalogue in Postgres knows what each build-up is called and what order
 * it goes together in. It does not know how deep each layer is or what it is
 * made of, because those are properties of a detail rather than of a product —
 * and the explorer draws details. So the depths, the conductivities and the
 * hatches live here, keyed to the same names and the same order the catalogue
 * already publishes, and nothing on the page invents a layer the catalogue does
 * not list.
 *
 * The names, the order, the titles and the straplines are the catalogue's own,
 * copied verbatim. Only the drawing information is new.
 *
 * Depths are the ones a detail is drawn at. Conductivities are declared values
 * for the material class, and the wet trades are set so the system's 27 mm sums
 * to the 0.02 m²K/W that `lib/build-up.ts` has always used for them — which is
 * what keeps the explorer and the configurator quoting the same U-value.
 */

/** The five hatches, all of them lifted from `components/construction-figure.tsx`. */
export type Pattern = "hatch" | "rule" | "stipple" | "dense-hatch" | "hairline";

/** What a layer is there to do. Drives the chips in the narrative panel. */
export type Role = "thermal" | "vapour" | "mechanical" | "fire" | "acoustic";

export type Layer = {
  id: string;
  name: string;
  /** Millimetres. Zero for anything that crosses the layers rather than forming one. */
  thicknessMm: number;
  /** W/(m·K), declared. Required, because the stat bar computes rather than quotes. */
  lambda: number;
  pattern: Pattern;
  role: Role[];
  /** Two or three sentences on what it does and why it matters. */
  body: string;
};

export type Construction = {
  id: string;
  index: string;
  title: string;
  strapline: string;
  productCount: number;
  layers: Layer[];
};

export const CONSTRUCTIONS: Construction[] = [
  {
    id: "external-wall",
    index: "01",
    title: "External wall",
    strapline: "Rendered external wall insulation (ETICS) on masonry and concrete.",
    productCount: 53,
    layers: [
      {
        id: "substrate",
        name: "Substrate",
        thicknessMm: 200,
        // 0.2 m / 1.111 = the 0.18 m²K/W a dense block wall is credited with.
        lambda: 1.111,
        pattern: "stipple",
        role: ["mechanical"],
        body: "The wall that is already there, and the only layer in the build-up nobody sells. Its resistance is worth about a tenth of what the board adds, but leaving it out makes every U-value on the sheet wrong in the same direction. Its condition decides the fixing too: a face that will not hold an anchor changes the specification before the insulation does.",
      },
      {
        id: "adhesive",
        name: "Adhesive mortar",
        thicknessMm: 10,
        lambda: 1.35,
        pattern: "dense-hatch",
        role: ["mechanical"],
        body: "Bonds the board to the wall and carries its dead load; the anchors are there for wind uplift, not for weight. Coverage is what makes it work — dabbed over less than 40 per cent of the board, it leaves a ventilated cavity behind the insulation, which is a fire path as much as a thermal one.",
      },
      {
        id: "board",
        name: "Insulation board",
        thicknessMm: 160,
        lambda: 0.035,
        pattern: "hatch",
        role: ["thermal", "fire"],
        body: "The layer the system is specified around, and the only one whose depth the specifier actually chooses. Everything else here is near enough constant, so move this and both figures at the foot of the sheet move with it. Above a certain building height it is the Euroclass rather than the λD that decides between mineral wool and polystyrene.",
      },
      {
        id: "anchor",
        name: "Mechanical anchor",
        thicknessMm: 0,
        lambda: 50,
        pattern: "hairline",
        role: ["mechanical"],
        body: "Crosses the layers rather than forming one, so it adds no depth and takes no part in the calculation. It resists wind uplift while the adhesive carries the weight. Its length is set by the board: the right anchor is the shortest that still reaches 25 mm past the adhesive into sound substrate.",
      },
      {
        id: "base-coat",
        name: "Base coat with embedded mesh",
        thicknessMm: 8,
        lambda: 1.35,
        pattern: "dense-hatch",
        role: ["mechanical", "fire"],
        body: "The reinforcement, and the layer that stops the render cracking over the board joints. The mesh belongs in the outer third of the wet coat rather than against the board — laid on the insulation and buttered over, it is doing nothing, which is the most common workmanship failure on a rendered wall.",
      },
      {
        id: "primer",
        name: "Primer",
        thicknessMm: 1,
        lambda: 1.35,
        pattern: "hairline",
        role: ["mechanical"],
        body: "A millimetre of not very much, and the reason the render colours evenly. It regulates the suction of the base coat so the finish does not dry at two speeds across one elevation.",
      },
      {
        id: "render",
        name: "Thin-coat render",
        thicknessMm: 8,
        lambda: 1.35,
        pattern: "dense-hatch",
        role: ["fire", "vapour"],
        body: "The only layer anyone will ever see, and as often as not the one that sets the system's reaction to fire. A silicone render sheds water and dirt; a mineral one is non-combustible and less forgiving of movement. The choice is a maintenance interval as much as an appearance.",
      },
    ],
  },

  {
    id: "pitched-roof",
    index: "02",
    title: "Pitched roof",
    strapline: "Insulation between and under rafters, and over-rafter board systems.",
    productCount: 14,
    layers: [
      {
        id: "covering",
        name: "Roof covering",
        thicknessMm: 25,
        lambda: 1.0,
        pattern: "stipple",
        role: ["mechanical"],
        body: "Tile or slate, laid to a lap rather than sealed, so it sheds water without ever being watertight. What it weighs decides the rafter, and what it costs to strip decides whether the insulation goes over the rafters or between them.",
      },
      {
        id: "battens",
        name: "Counter batten and batten",
        thicknessMm: 63,
        lambda: 0.13,
        pattern: "rule",
        role: ["mechanical", "vapour"],
        body: "Two layers of timber at right angles, and the drained, ventilated cavity between them. The counter batten is the one that matters: without it, whatever gets past the tiles runs along the membrane instead of down it.",
      },
      {
        id: "breather",
        name: "Breather membrane",
        thicknessMm: 1,
        lambda: 0.5,
        pattern: "hairline",
        role: ["vapour"],
        body: "Sheds anything that gets past the covering and lets water vapour out of the construction. Vapour-open on the cold side and vapour-tight on the warm side is the rule the whole roof is arranged around; a membrane fitted the wrong way up traps moisture in the insulation.",
      },
      {
        id: "insulation",
        name: "Over-rafter or between-rafter insulation",
        thicknessMm: 140,
        lambda: 0.042,
        pattern: "hatch",
        role: ["thermal", "acoustic"],
        body: "Between the rafters it has to be friction-fit and vapour-open, so it stays where it was put and the roof can still dry. Over them it has to carry foot traffic during construction and take a fixing. Summer overheating rather than winter heat loss is usually what pushes a specifier towards wood fibre here.",
      },
      {
        id: "vcl",
        name: "Vapour control layer",
        thicknessMm: 1,
        lambda: 0.5,
        pattern: "hairline",
        role: ["vapour"],
        body: "The warm-side barrier, and the layer that decides whether the roof stays dry. Its performance is a question of joints and penetrations rather than of the sheet: one downlight cut through it undoes more than the material ever provided.",
      },
      {
        id: "lining",
        name: "Internal lining",
        thicknessMm: 12.5,
        lambda: 0.25,
        pattern: "rule",
        role: ["fire"],
        body: "Plasterboard, and the last thing fitted. It is a fire lining before it is a finish — the reaction-to-fire class of the ceiling buys the time the insulation behind it does not have.",
      },
    ],
  },

  {
    id: "flat-roof",
    index: "03",
    title: "Flat roof",
    strapline: "Warm-deck flat roof insulation under a bonded waterproofing layer.",
    productCount: 8,
    layers: [
      {
        id: "waterproofing",
        name: "Waterproofing membrane",
        thicknessMm: 4,
        lambda: 0.23,
        pattern: "dense-hatch",
        role: ["vapour", "mechanical"],
        body: "Single-ply or bituminous, bonded or ballasted, and the only layer keeping water out of everything under it. On a warm deck it sits above the insulation, so every fixing through it is a hole in the roof and a thermal bridge at the same time.",
      },
      {
        id: "insulation",
        name: "Insulation board",
        thicknessMm: 200,
        lambda: 0.038,
        pattern: "hatch",
        role: ["thermal"],
        body: "Above the deck and below the waterproofing, so the structure stays warm and the dew point stays out of it. Compressive strength rather than λD is the real constraint: this board carries maintenance traffic through the membrane for the life of the roof.",
      },
      {
        id: "vcl",
        name: "Vapour control layer",
        thicknessMm: 1,
        lambda: 0.5,
        pattern: "hairline",
        role: ["vapour"],
        body: "On the warm side of the insulation, which on a warm deck means directly on the structure. It is also the temporary waterproofing during construction, and construction is when most flat roofs get wet.",
      },
      {
        id: "primer",
        name: "Primer",
        thicknessMm: 1,
        lambda: 1.35,
        pattern: "hairline",
        role: ["mechanical"],
        body: "Prepares the deck so the vapour control layer bonds to it rather than sitting on it. On a concrete deck it is also what stops residual construction moisture blowing that bond.",
      },
      {
        id: "deck",
        name: "Structural deck",
        thicknessMm: 150,
        lambda: 2.0,
        pattern: "stipple",
        role: ["mechanical"],
        body: "Concrete, timber or profiled metal, and the thing everything above it is fixed to. It also sets the fall: a flat roof is never flat, and the 1:80 it is laid to is the difference between one that drains and one that ponds.",
      },
    ],
  },

  {
    id: "floor",
    index: "04",
    title: "Floor & screed",
    strapline: "Insulation under screed, with impact sound separation.",
    productCount: 10,
    layers: [
      {
        id: "finish",
        name: "Floor finish",
        thicknessMm: 10,
        lambda: 0.17,
        pattern: "rule",
        role: ["mechanical"],
        body: "Tile, board or resin, and the layer that decides how long the screed has to dry before anyone can start. A vapour-tight finish laid over a screed still giving up water is the most expensive failure in this build-up.",
      },
      {
        id: "screed",
        name: "Screed",
        thicknessMm: 65,
        lambda: 1.4,
        pattern: "dense-hatch",
        role: ["mechanical", "acoustic"],
        body: "The load-spreading layer, and on a floating floor the only thing between the finish and the insulation. Its depth is set by what is underneath rather than by what goes on top: over a compressible layer it has to be thick enough not to crack.",
      },
      {
        id: "separating",
        name: "Separating layer",
        thicknessMm: 1,
        lambda: 0.5,
        pattern: "hairline",
        role: ["acoustic"],
        body: "A polythene sheet, and the reason the screed is floating rather than bonded. It keeps the wet screed out of the insulation joints and keeps the cured screed from gripping the layer that is meant to let it move.",
      },
      {
        id: "impact",
        name: "Impact sound insulation",
        thicknessMm: 30,
        lambda: 0.039,
        pattern: "hatch",
        role: ["acoustic"],
        body: "Specified for footfall rather than for heat. It works by being soft, which is the one thing a screed does not want under it, so dynamic stiffness and compressive creep are the two declared values that decide the choice.",
      },
      {
        id: "thermal",
        name: "Thermal insulation",
        thicknessMm: 100,
        lambda: 0.034,
        pattern: "hatch",
        role: ["thermal"],
        body: "The depth this build-up is specified around, and the layer under permanent load for the life of the floor. Long-term deformation rather than λD is what rules boards out here: two millimetres of creep is two millimetres the skirting has to cover.",
      },
      {
        id: "dpm",
        name: "Damp proof membrane",
        thicknessMm: 1,
        lambda: 0.5,
        pattern: "hairline",
        role: ["vapour"],
        body: "Ties into the wall's damp proof course and keeps ground moisture out of everything above it. It is lapped, taped and turned up rather than simply laid, because a floor membrane fails at its joints and its upstands or it does not fail at all.",
      },
      {
        id: "slab",
        name: "Structural slab",
        thicknessMm: 200,
        lambda: 2.0,
        pattern: "stipple",
        role: ["mechanical"],
        body: "The ground-bearing or suspended slab, and the datum every depth above it is measured from. Where floor level is fixed by a door threshold, this is the layer that decides how much insulation there is room for.",
      },
    ],
  },

  {
    id: "internal-partition",
    index: "05",
    title: "Internal partition",
    strapline: "Acoustic and fire infill for metal stud and timber stud partitions.",
    productCount: 7,
    layers: [
      {
        id: "lining-a",
        name: "Board lining",
        thicknessMm: 12.5,
        lambda: 0.25,
        pattern: "rule",
        role: ["fire", "acoustic"],
        body: "Two layers of plasterboard more often than one, because mass is what stops sound and a second board buys it more cheaply than anything else in the wall. Its fire class is the partition's fire class; the wool behind it is never exposed.",
      },
      {
        id: "stud",
        name: "Metal or timber stud",
        thicknessMm: 0,
        lambda: 50,
        pattern: "hairline",
        role: ["mechanical", "acoustic"],
        body: "Crosses the cavity rather than filling it, so it adds no depth to the calculation and a great deal to the result. Stud spacing, and whether the two linings share a frame, change the tested sound reduction of the assembly more than the wool's own conductivity does.",
      },
      {
        id: "cavity",
        name: "Cavity insulation",
        thicknessMm: 100,
        lambda: 0.037,
        pattern: "hatch",
        role: ["acoustic", "fire"],
        body: "Specified for sound and fire, not for heat loss. The wool has no Rw of its own — only the tested assembly has one, and quoting a figure for the material alone would be meaningless. What it does is damp the cavity resonance the two linings would otherwise have between them.",
      },
      {
        id: "lining-b",
        name: "Board lining",
        thicknessMm: 12.5,
        lambda: 0.25,
        pattern: "rule",
        role: ["fire", "acoustic"],
        body: "The second face, and where the partition meets everything else. A tested system is only as good as its perimeter: an unsealed head detail, or two sockets fitted back to back, loses more decibels than any board thickness recovers.",
      },
    ],
  },
];

/** Every layer in the site, in order, which is what the scroll track is measured off. */
export const TOTAL_LAYERS = CONSTRUCTIONS.reduce((n, c) => n + c.layers.length, 0);

export const constructionById = (id: string): Construction =>
  CONSTRUCTIONS.find((c) => c.id === id) ?? CONSTRUCTIONS[0]!;

/** The function chips, in the order they read best when a layer has several. */
export const ROLE_ORDER: Role[] = ["thermal", "vapour", "mechanical", "fire", "acoustic"];

export const sortRoles = (roles: Role[]): Role[] =>
  [...roles].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
