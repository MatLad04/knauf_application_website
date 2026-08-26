/**
 * Writes data/catalogue.json — the fictional Kernbau catalogue.
 *
 * Products are declared as families with variants because that is how a real
 * catalogue works: one slab, six thicknesses, one datasheet. Declaring the
 * family once keeps every variant consistent with it.
 *
 * Every value here is invented. The units, standards and document formats
 * around them follow real practice. Run: npm run catalogue:generate
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "catalogue.json");

/** Euroclass → rank, so fire performance can be sorted and compared. */
const FIRE_RANK = { A1: 1, "A2-s1,d0": 2, "B-s1,d0": 3, "C-s2,d0": 4, "D-s2,d0": 5, E: 6, F: 7 };

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ---------------------------------------------------------------------------
// Categories — what a product IS.
// ---------------------------------------------------------------------------
const categories = [
  {
    slug: "mineral-wool",
    name: "Mineral wool insulation",
    summary:
      "Non-combustible stone and glass wool in slab and roll form. Euroclass A1 throughout, vapour-open, and the default where fire performance governs.",
    texture_key: "mineral-wool",
    sort_order: 1,
  },
  {
    slug: "rigid-boards",
    name: "Rigid board insulation",
    summary:
      "Expanded and extruded polystyrene boards. Lower conductivity per millimetre than wool, load-bearing under screed, and combustible — Euroclass E.",
    texture_key: "eps",
    sort_order: 2,
  },
  {
    slug: "wood-fibre",
    name: "Wood fibre insulation",
    summary:
      "Renewable fibre boards and flexible batts. High heat capacity for summer overheating, vapour-open, and the family with the strongest environmental declaration.",
    texture_key: "wood-fibre",
    sort_order: 3,
  },
  {
    slug: "reinforcement",
    name: "Reinforcement meshes & profiles",
    summary:
      "Alkali-resistant glass fibre mesh and the edge, corner and joint profiles that terminate a rendered system.",
    texture_key: "mesh",
    sort_order: 4,
  },
  {
    slug: "adhesives-base-coats",
    name: "Adhesives & base coats",
    summary:
      "Cementitious and dispersion mortars that bond the insulation to the substrate and carry the reinforcement layer.",
    texture_key: "cement",
    sort_order: 5,
  },
  {
    slug: "render-finishes",
    name: "Render finishes",
    summary:
      "Silicone, silicate and mineral thin-coat renders, graded by grain size, plus the primers that precede them.",
    texture_key: "render",
    sort_order: 6,
  },
  {
    slug: "anchors-accessories",
    name: "Anchors & accessories",
    summary:
      "Mechanical fixings and the small components that make a system compliant: plugs, caps, base rails, sealing tapes.",
    texture_key: "anchor",
    sort_order: 7,
  },
];

// ---------------------------------------------------------------------------
// Applications — where a product GOES. The State A entry point.
// ---------------------------------------------------------------------------
const applications = [
  {
    slug: "external-wall",
    name: "External wall",
    index_no: 1,
    summary: "Rendered external wall insulation (ETICS) on masonry and concrete.",
    description:
      "An external thermal insulation composite system is a bonded, mechanically secured build-up: adhesive, insulation, anchors, a reinforced base coat and a thin-coat render. It is specified as one system, not as seven articles, because the compatibility between the layers is what the system approval covers. Fire performance is normally what decides between mineral wool and polystyrene above a given building height.",
    image_key: "external-wall",
    build_up: [
      "Substrate",
      "Adhesive mortar",
      "Insulation board",
      "Mechanical anchor",
      "Base coat with embedded mesh",
      "Primer",
      "Thin-coat render",
    ],
  },
  {
    slug: "pitched-roof",
    name: "Pitched roof",
    index_no: 2,
    summary: "Insulation between and under rafters, and over-rafter board systems.",
    description:
      "A pitched roof is insulated between the rafters, under them, or above them. Between-rafter insulation has to be friction-fit and vapour-open; over-rafter boards have to carry foot traffic during construction and take a fixing. Summer overheating, not winter heat loss, is usually what pushes a specifier towards wood fibre here.",
    image_key: "pitched-roof",
    build_up: [
      "Roof covering",
      "Counter batten and batten",
      "Breather membrane",
      "Over-rafter or between-rafter insulation",
      "Vapour control layer",
      "Internal lining",
    ],
  },
  {
    slug: "flat-roof",
    name: "Flat roof",
    index_no: 3,
    summary: "Warm-deck flat roof insulation under a bonded waterproofing layer.",
    description:
      "A warm-deck flat roof puts the insulation above the structural deck and below the waterproofing, so the deck stays warm and the vapour control layer sits on the warm side. Compressive strength is a real constraint: the insulation carries maintenance traffic through the membrane for the life of the roof.",
    image_key: "flat-roof",
    build_up: [
      "Waterproofing membrane",
      "Insulation board",
      "Vapour control layer",
      "Primer",
      "Structural deck",
    ],
  },
  {
    slug: "floor",
    name: "Floor & screed",
    index_no: 4,
    summary: "Insulation under screed, with impact sound separation.",
    description:
      "Floor insulation is loaded permanently and dynamically, so compressive strength and long-term deformation govern the choice. Where the floor separates dwellings, an impact sound layer is added and the screed is isolated from every wall with an edge strip — a detail that fails more often through workmanship than through specification.",
    image_key: "floor",
    build_up: [
      "Floor finish",
      "Screed",
      "Separating layer",
      "Impact sound insulation",
      "Thermal insulation",
      "Damp proof membrane",
      "Structural slab",
    ],
  },
  {
    slug: "internal-partition",
    name: "Internal partition",
    index_no: 5,
    summary: "Acoustic and fire infill for metal stud and timber stud partitions.",
    description:
      "Partition insulation is specified for sound and fire, not for heat loss. The declared value that matters is the weighted sound reduction index of the tested assembly — the wool on its own has no Rw, and quoting one for it would be meaningless. Cavity fill depth and stud spacing change the result more than the wool's own conductivity does.",
    image_key: "internal-partition",
    build_up: ["Board lining", "Metal or timber stud", "Cavity insulation", "Board lining"],
  },
];

// ---------------------------------------------------------------------------
// Families. Each produces one or more products.
// ---------------------------------------------------------------------------
const families = [
  // ---- Mineral wool -------------------------------------------------------
  {
    key: "mw-facade",
    line: "Kernlan",
    name: "Kernlan FS 035 Facade Slab",
    codeBase: "KB-MW-035",
    category: "mineral-wool",
    texture: "mineral-wool",
    standard: "EN 13162",
    fire: "A1",
    epd: true,
    applications: [["external-wall", true]],
    substrates: ["Concrete", "Brickwork", "Blockwork", "Cement render", "Lime render"],
    summary: "Non-combustible stone wool facade slab for bonded and anchored render systems.",
    description:
      "A dual-density stone wool slab for rendered external wall insulation. The denser outer face takes the base coat without deforming under the trowel; the softer inner face follows the irregularities of an existing masonry wall. Euroclass A1 means it makes no contribution to a fire at any point in the system, which is what allows the same detail to be used above the height at which polystyrene stops being acceptable.",
    spec: { lambda: 0.035, density: 100, mu: 1, cs: 20, format: "1000 × 600" },
    thicknesses: [60, 80, 100, 120, 140, 160],
    buildUp: "etics-mineral",
  },
  {
    key: "mw-facade-032",
    line: "Kernlan",
    name: "Kernlan FS 032 High-Performance Facade Slab",
    codeBase: "KB-MW-032",
    category: "mineral-wool",
    texture: "mineral-wool",
    standard: "EN 13162",
    fire: "A1",
    epd: true,
    applications: [["external-wall", true]],
    substrates: ["Concrete", "Brickwork", "Blockwork", "Cement render"],
    summary:
      "Denser stone wool slab reaching λD 0.032 W/(m·K) where wall build-up depth is constrained.",
    description:
      "The same non-combustible construction as the FS 035 slab, spun and compressed to reach a lower declared conductivity. Specified where a boundary line, a window reveal or a planning constraint caps the depth the wall can grow by, and the 3 mm per hundred saved by the lower lambda is the difference between a detail that works and one that does not.",
    spec: { lambda: 0.032, density: 130, mu: 1, cs: 30, format: "1000 × 600" },
    thicknesses: [60, 80, 100, 120, 140],
    buildUp: "etics-mineral",
  },
  {
    key: "mw-partition",
    line: "Kernlan",
    name: "Kernlan PR 037 Partition Roll",
    codeBase: "KB-MW-037",
    category: "mineral-wool",
    texture: "mineral-wool",
    standard: "EN 13162",
    fire: "A1",
    epd: true,
    applications: [
      ["internal-partition", true],
      ["pitched-roof", false],
    ],
    substrates: ["Metal stud partitions", "Timber stud partitions", "Between rafters"],
    summary: "Friction-fit glass wool roll for acoustic and fire infill in stud partitions.",
    description:
      "A light glass wool roll cut to standard stud centres, held by friction without fixings. The declared acoustic figure belongs to the tested partition assembly, not to the wool: the same roll in a twin-frame partition performs very differently from the same roll in a single frame. Non-combustible, so it does not compromise the fire rating of the lining boards.",
    spec: { lambda: 0.037, density: 16, mu: 1, format: "1200 × 600" },
    rwByThickness: { 45: 44, 60: 48, 80: 52, 100: 56 },
    thicknesses: [45, 60, 80, 100],
    buildUp: "partition",
  },
  {
    key: "mw-loft",
    line: "Kernlan",
    name: "Kernlan LR 040 Loft Roll",
    codeBase: "KB-MW-040",
    category: "mineral-wool",
    texture: "mineral-wool",
    standard: "EN 13162",
    fire: "A1",
    epd: true,
    applications: [["pitched-roof", true]],
    substrates: ["Between ceiling joists", "Between rafters"],
    summary: "Wide glass wool roll for cold-loft and between-rafter insulation.",
    description:
      "A low-density roll for unloaded horizontal application, laid in two layers with the second crossing the joists to break the thermal bridge. Vapour-open, so the roof can dry inwards where the ceiling has no continuous vapour control layer.",
    spec: { lambda: 0.04, density: 12, mu: 1, format: "5000 × 1140" },
    thicknesses: [100, 140, 180],
    buildUp: "pitched-between",
  },
  {
    key: "mw-flatroof",
    line: "Kernlan",
    name: "Kernlan RD 038 Flat Roof Slab",
    codeBase: "KB-MW-038",
    category: "mineral-wool",
    texture: "mineral-wool",
    standard: "EN 13162",
    fire: "A1",
    epd: true,
    applications: [["flat-roof", true]],
    substrates: ["Concrete deck", "Profiled steel deck", "Timber deck"],
    summary: "Load-bearing stone wool slab for warm-deck flat roofs under bonded membranes.",
    description:
      "A compressed stone wool slab specified where the roof build-up must be non-combustible over its whole area — over a steel deck, or where a compartment wall passes through the roof. Takes bonded bituminous and single-ply membranes and carries maintenance traffic without a permanent indentation.",
    spec: { lambda: 0.038, density: 150, mu: 1, cs: 70, format: "1200 × 1000" },
    thicknesses: [80, 120, 160, 200],
    buildUp: "flat-roof",
  },

  // ---- Rigid boards -------------------------------------------------------
  {
    key: "eps-grey",
    line: "Kernpor",
    name: "Kernpor GF 031 Graphite Facade Board",
    codeBase: "KB-EPS-031",
    category: "rigid-boards",
    texture: "eps",
    standard: "EN 13163",
    fire: "E",
    epd: true,
    applications: [["external-wall", true]],
    substrates: ["Concrete", "Brickwork", "Blockwork", "Cement render"],
    summary: "Graphite-loaded EPS board, λD 0.031 W/(m·K), for bonded render systems.",
    description:
      "Expanded polystyrene with graphite dispersed through the bead, which reflects infrared radiation back into the board and buys roughly fifteen per cent over white EPS at the same thickness. Cheaper and lighter per square metre than mineral wool and considerably better per millimetre — but Euroclass E, so its use is governed by building height and by the fire barriers detailed around openings.",
    spec: { lambda: 0.031, density: 17, mu: 30, cs: 80, format: "1000 × 500" },
    thicknesses: [60, 80, 100, 120, 140, 160],
    buildUp: "etics-eps",
  },
  {
    key: "eps-white",
    line: "Kernpor",
    name: "Kernpor WF 036 White Facade Board",
    codeBase: "KB-EPS-036",
    category: "rigid-boards",
    texture: "eps",
    standard: "EN 13163",
    fire: "E",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["Concrete", "Brickwork", "Blockwork"],
    summary: "Standard white EPS facade board for bonded render systems.",
    description:
      "The baseline rendered-facade board: white expanded polystyrene, cut from block, dimensionally stabilised before delivery so it does not shrink behind the render. Specified where the wall has depth to spare and the graphite board's lower conductivity is not worth its cost.",
    spec: { lambda: 0.036, density: 15, mu: 30, cs: 70, format: "1000 × 500" },
    thicknesses: [60, 80, 100, 120],
    buildUp: "etics-eps",
  },
  {
    key: "xps",
    line: "Kerndur",
    name: "Kerndur XP 034 Perimeter Board",
    codeBase: "KB-XPS-034",
    category: "rigid-boards",
    texture: "xps",
    standard: "EN 13164",
    fire: "E",
    epd: true,
    applications: [
      ["floor", true],
      ["flat-roof", false],
    ],
    substrates: ["Concrete slab", "Below ground perimeter", "Inverted roof deck"],
    summary: "Closed-cell extruded polystyrene for loaded, wet and below-ground positions.",
    description:
      "Extruded polystyrene with a closed cell structure and a skin on both faces, so it absorbs almost no water and keeps its declared conductivity in permanently damp positions. This is the board used below ground against the perimeter, under a loaded slab, and in inverted roofs where it sits above the waterproofing and gets rained on for the life of the building.",
    spec: { lambda: 0.034, density: 33, mu: 100, cs: 300, format: "1250 × 600" },
    thicknesses: [50, 80, 100, 120],
    buildUp: "floor",
  },
  {
    key: "eps-floor",
    line: "Kernpor",
    name: "Kernpor IS 039 Impact Sound Board",
    codeBase: "KB-EPS-039",
    category: "rigid-boards",
    texture: "eps",
    standard: "EN 13163",
    fire: "E",
    epd: false,
    applications: [["floor", true]],
    substrates: ["Concrete slab", "Under floating screed"],
    summary: "Elasticised EPS board for impact sound separation under floating screeds.",
    description:
      "Elasticised expanded polystyrene: the block is compressed after moulding so the board can deflect under load and decouple the screed from the structure. Laid with a perimeter edge strip that must run the full depth of the screed — if the screed touches the wall anywhere, the impact sound improvement is lost regardless of what the board declares.",
    spec: { lambda: 0.039, density: 20, mu: 20, cs: 30, format: "1000 × 500" },
    rwByThickness: { 20: 26, 30: 28, 40: 30 },
    thicknesses: [20, 30, 40],
    buildUp: "floor",
  },

  // ---- Wood fibre ---------------------------------------------------------
  {
    key: "wf-board",
    line: "Kernholz",
    name: "Kernholz SB 042 Sarking Board",
    codeBase: "KB-WF-042",
    category: "wood-fibre",
    texture: "wood-fibre",
    standard: "EN 13171",
    fire: "E",
    epd: true,
    applications: [
      ["pitched-roof", true],
      ["external-wall", false],
    ],
    substrates: ["Over rafters", "Timber frame sheathing"],
    summary:
      "Tongue-and-groove wood fibre board for over-rafter insulation and timber frame sheathing.",
    description:
      "A wet-process wood fibre board with a hydrophobic surface, laid over the rafters with tongue-and-groove edges so the layer is continuous and the rafters stop being thermal bridges. Its heat capacity is roughly three times that of mineral wool at the same thickness, which is why it appears in specifications concerned with summer overheating in rooms in the roof rather than in ones concerned only with the U-value.",
    spec: { lambda: 0.042, density: 160, mu: 5, cs: 100, format: "1800 × 600" },
    thicknesses: [60, 80, 100, 140],
    buildUp: "pitched-over",
  },
  {
    key: "wf-flex",
    line: "Kernholz",
    name: "Kernholz FX 038 Flexible Batt",
    codeBase: "KB-WF-038",
    category: "wood-fibre",
    texture: "wood-fibre",
    standard: "EN 13171",
    fire: "E",
    epd: true,
    applications: [
      ["pitched-roof", true],
      ["internal-partition", false],
    ],
    substrates: ["Between rafters", "Timber stud partitions"],
    summary: "Flexible wood fibre batt for friction fit between rafters and studs.",
    description:
      "A flexible batt held by friction between rafters or studs, cut ten millimetres oversize so it springs into the opening. Vapour-open, so it suits roof build-ups designed to dry in both directions, and dense enough to add usefully to the acoustic performance of a timber partition.",
    spec: { lambda: 0.038, density: 50, mu: 3, format: "1200 × 575" },
    rwByThickness: { 60: 42, 100: 47, 140: 50 },
    thicknesses: [60, 100, 140],
    buildUp: "pitched-between",
  },

  // ---- Reinforcement ------------------------------------------------------
  {
    key: "mesh",
    line: "Kerntex",
    name: "Kerntex RM Reinforcement Mesh",
    codeBase: "KB-RM",
    category: "reinforcement",
    texture: "mesh",
    standard: "ETAG 004",
    fire: "A2-s1,d0",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["Embedded in base coat"],
    summary: "Alkali-resistant glass fibre mesh embedded in the base coat.",
    description:
      "An alkali-resistant coated glass fibre mesh, embedded in the upper third of the wet base coat so that the coat, not the mesh, takes the trowel. It is what stops the render cracking as the insulation behind it moves with temperature. Overlaps of at least 100 mm at every joint, and a diagonal patch at every corner of every opening — the two places a rendered facade cracks first.",
    variants: [
      {
        code: "KB-RM-145",
        label: "145 g/m²",
        format: "50 m × 1.10 m",
        note: "Standard weight for residential facades.",
      },
      {
        code: "KB-RM-165",
        label: "165 g/m²",
        format: "50 m × 1.10 m",
        note: "Default specification across the Kernbau ETICS range.",
      },
      {
        code: "KB-RM-330",
        label: "330 g/m² armour",
        format: "25 m × 1.00 m",
        note: "Impact-resistant layer to 2 m above ground level.",
      },
    ],
    buildUp: null,
  },
  {
    key: "profiles",
    line: "Kerntex",
    name: "Kerntex Profiles",
    codeBase: "KB-PF",
    category: "reinforcement",
    texture: "mesh",
    standard: "ETAG 004",
    fire: "A2-s1,d0",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["System edges and openings"],
    summary: "Edge, corner and joint profiles that terminate a rendered system.",
    description:
      "Every rendered facade fails at its edges before it fails in its field. These are the components that give the render a defined termination: a base rail that sets the first course level and stops water tracking behind the insulation, mesh-winged beads that hold a corner straight, a bellcast that throws water clear of a reveal, and a movement joint profile that lets the system move where the structure behind it does.",
    variants: [
      {
        code: "KB-PF-BR",
        label: "Base rail, 2.5 m",
        format: "Aluminium, per board thickness",
        note: "Sets the bottom course and drips water clear.",
      },
      {
        code: "KB-PF-CB",
        label: "Mesh corner bead",
        format: "2.5 m",
        note: "PVC bead with a bonded mesh wing.",
      },
      {
        code: "KB-PF-BC",
        label: "Bellcast bead",
        format: "2.5 m",
        note: "Terminates the system at a soffit or reveal.",
      },
      {
        code: "KB-PF-MJ",
        label: "Movement joint profile",
        format: "2.5 m",
        note: "Accommodates structural movement through the system.",
      },
    ],
    buildUp: null,
  },

  // ---- Adhesives & base coats ---------------------------------------------
  {
    key: "adhesive",
    line: "Kernfix",
    name: "Kernfix AM Adhesive Mortar",
    codeBase: "KB-AD",
    category: "adhesives-base-coats",
    texture: "cement",
    standard: "EN 998-1",
    fire: "A1",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["Concrete", "Brickwork", "Blockwork", "Sound existing render"],
    summary: "Cementitious mortars for bonding insulation boards to the substrate.",
    description:
      "A cement-based, polymer-modified powder mortar mixed with water on site. Applied as a perimeter bead and three dabs on an uneven substrate, or full-bed with a notched trowel on a flat one — the bead-and-dab method must still reach forty per cent contact, which is the figure the system approval is tested at. The universal grade doubles as the base coat, which removes one product from the site and one opportunity to mix the wrong bag.",
    variants: [
      {
        code: "KB-AD-100",
        label: "Board adhesive",
        consumption: "5.0 kg/m²",
        note: "Bonding only.",
      },
      {
        code: "KB-AD-200",
        label: "Universal adhesive & base coat",
        consumption: "5.0 kg/m² bonding, 6.5 kg/m² base coat",
        note: "Default across the Kernbau ETICS range.",
      },
    ],
    buildUp: null,
  },
  {
    key: "basecoat",
    line: "Kernbase",
    name: "Kernbase BC Reinforcing Base Coat",
    codeBase: "KB-BC",
    category: "adhesives-base-coats",
    texture: "cement",
    standard: "EN 998-1",
    fire: "A1",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["Insulation boards"],
    summary: "Reinforcing coats that carry the mesh and level the insulation layer.",
    description:
      "The structural layer of a rendered facade. Applied in two passes with the mesh embedded in the upper third, at a total thickness that must not drop below the declared minimum anywhere — thin spots over a board joint are where the first crack appears. The lightweight grade halves the load on the anchors and is specified over thicker insulation build-ups.",
    variants: [
      {
        code: "KB-BC-300",
        label: "Standard base coat",
        consumption: "6.5 kg/m² at 5 mm",
        note: "General purpose, 3–5 mm applied.",
      },
      {
        code: "KB-BC-350",
        label: "Lightweight base coat",
        consumption: "4.2 kg/m² at 5 mm",
        note: "Reduced dead load over deep insulation.",
      },
    ],
    buildUp: null,
  },
  {
    key: "primer",
    line: "Kernbase",
    name: "Kernbase PR Quartz Primer",
    codeBase: "KB-PR",
    category: "adhesives-base-coats",
    texture: "cement",
    standard: "EN 15824",
    fire: "A2-s1,d0",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["Base coat", "Existing render", "Concrete"],
    summary: "Pigmented quartz-filled primer between base coat and render.",
    description:
      "Tinted to the render colour so the base coat does not read through a thin finish, and filled with quartz to give the render something to key into. Skipping it is the most common cause of a patchy first-summer facade.",
    variants: [
      {
        code: "KB-PR-010",
        label: "Quartz primer",
        consumption: "0.25 kg/m²",
        note: "Tinted to the specified render colour.",
      },
    ],
    buildUp: null,
  },

  // ---- Render finishes ----------------------------------------------------
  {
    key: "silicone",
    line: "Kernput",
    name: "Kernput SI Silicone Render",
    codeBase: "KB-RF-SI",
    category: "render-finishes",
    texture: "render",
    standard: "EN 15824",
    fire: "B-s1,d0",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["Quartz primer over base coat"],
    summary: "Ready-mixed silicone thin-coat render: water-repellent, vapour-open, low soiling.",
    description:
      "A ready-mixed organic render with a silicone binder, supplied in a tub and applied to the grain size, then floated to raise the texture. Highly water-repellent while staying vapour-open, which is the combination that keeps a rendered wall dry from outside and lets it dry outwards. The default finish across the Kernbau range; the grain size sets both the texture and the coverage.",
    variants: [
      {
        code: "KB-RF-SI-15",
        label: "1.5 mm grain",
        consumption: "2.4 kg/m²",
        mu: 60,
        note: "Fine texture, the standard residential finish.",
      },
      {
        code: "KB-RF-SI-20",
        label: "2.0 mm grain",
        consumption: "3.0 kg/m²",
        mu: 60,
        note: "Medium texture, forgiving over an uneven base coat.",
      },
      {
        code: "KB-RF-SI-30",
        label: "3.0 mm grain",
        consumption: "4.1 kg/m²",
        mu: 60,
        note: "Coarse texture for large, plain elevations.",
      },
    ],
    buildUp: null,
  },
  {
    key: "silicate",
    line: "Kernput",
    name: "Kernput SL Silicate Render",
    codeBase: "KB-RF-SL",
    category: "render-finishes",
    texture: "render",
    standard: "EN 15824",
    fire: "A2-s1,d0",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["Silicate primer over base coat"],
    summary: "Potassium silicate render, mineral-bound and highly vapour-open.",
    description:
      "Bound with potassium silicate, which reacts with the mineral substrate rather than forming a film over it. Very high vapour permeability, so it is the finish specified over mineral wool and on historic fabric where the wall has to breathe. Less water-repellent than silicone and less forgiving of application in the wrong weather.",
    variants: [
      {
        code: "KB-RF-SL-15",
        label: "1.5 mm grain",
        consumption: "2.6 kg/m²",
        mu: 25,
        note: "Fine texture.",
      },
      {
        code: "KB-RF-SL-20",
        label: "2.0 mm grain",
        consumption: "3.2 kg/m²",
        mu: 25,
        note: "Medium texture.",
      },
    ],
    buildUp: null,
  },
  {
    key: "mineral",
    line: "Kernput",
    name: "Kernput MI Mineral Render",
    codeBase: "KB-RF-MI",
    category: "render-finishes",
    texture: "render",
    standard: "EN 998-1",
    fire: "A1",
    epd: true,
    applications: [["external-wall", true]],
    substrates: ["Base coat"],
    summary: "Cement-lime powder render, Euroclass A1, site-mixed.",
    description:
      "A dry powder render mixed on site. Non-combustible throughout, so it is the finish that keeps a mineral wool system Euroclass A1 from substrate to surface — the reason to specify it is almost always fire, not appearance. Supplied white and painted after curing where colour is required.",
    variants: [
      {
        code: "KB-RF-MI-20",
        label: "2.0 mm grain",
        consumption: "3.4 kg/m²",
        mu: 15,
        note: "Overcoat with facade paint after 7 days.",
      },
      {
        code: "KB-RF-MI-30",
        label: "3.0 mm grain",
        consumption: "4.5 kg/m²",
        mu: 15,
        note: "Coarse texture.",
      },
    ],
    buildUp: null,
  },
  {
    key: "paint",
    line: "Kernput",
    name: "Kernput FP Facade Paint",
    codeBase: "KB-FP",
    category: "render-finishes",
    texture: "render",
    standard: "EN 1062-1",
    fire: "B-s1,d0",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["Mineral render", "Silicate render", "Sound existing paint"],
    summary: "Silicone-emulsion facade paint for mineral renders and refurbishment.",
    description:
      "A silicone emulsion paint for colouring mineral render and for recoating an existing facade that is sound but tired. Two coats over a thinned first coat; the vapour permeability of the paint has to be at least that of the render beneath it, or the coating becomes the trap.",
    variants: [
      {
        code: "KB-FP-100",
        label: "Silicone emulsion",
        consumption: "0.35 l/m² in two coats",
        mu: 100,
        note: "Available in the Kernbau facade colour range.",
      },
    ],
    buildUp: null,
  },

  // ---- Anchors & accessories ---------------------------------------------
  {
    key: "anchor",
    line: "Kernanker",
    name: "Kernanker SF Screw-In Anchor",
    codeBase: "KB-AN-SF",
    category: "anchors-accessories",
    texture: "anchor",
    standard: "ETAG 014",
    fire: "E",
    epd: false,
    applications: [["external-wall", true]],
    substrates: ["Concrete", "Solid brickwork", "Perforated brickwork", "Lightweight blockwork"],
    summary: "Screw-in plastic anchor with a steel pin for insulation up to 200 mm.",
    description:
      "A screw-in anchor with a plastic sleeve and a galvanised steel pin, set flush and capped so the head does not read through the render as a cold spot. The declared point thermal transmittance is 0.001 W/K, low enough that a typical anchor pattern costs the wall almost nothing thermally. Anchor length is the insulation thickness plus the base coat plus a fixed embedment depth — the size in the code is the insulation thickness the anchor is intended for.",
    variants: [
      {
        code: "KB-AN-SF-095",
        label: "95 mm, for 60 mm insulation",
        note: "8 mm drill, 35 mm embedment.",
      },
      {
        code: "KB-AN-SF-115",
        label: "115 mm, for 80 mm insulation",
        note: "8 mm drill, 35 mm embedment.",
      },
      {
        code: "KB-AN-SF-135",
        label: "135 mm, for 100 mm insulation",
        note: "8 mm drill, 35 mm embedment.",
      },
      {
        code: "KB-AN-SF-175",
        label: "175 mm, for 140 mm insulation",
        note: "8 mm drill, 35 mm embedment.",
      },
      {
        code: "KB-AN-SF-215",
        label: "215 mm, for 180 mm insulation",
        note: "8 mm drill, 35 mm embedment.",
      },
    ],
    buildUp: null,
  },
  {
    key: "accessories",
    line: "Kernanker",
    name: "Kernbau System Accessories",
    codeBase: "KB-AC",
    category: "anchors-accessories",
    texture: "anchor",
    standard: "ETAG 004",
    fire: "E",
    epd: false,
    applications: [
      ["external-wall", true],
      ["floor", false],
    ],
    substrates: ["System details"],
    summary: "The small components a compliant system detail depends on.",
    description:
      "Insulation caps that close over a recessed anchor head, expanding tape that seals the system against a window frame without relying on sealant alone, and the perimeter edge strip that isolates a floating screed from every wall it meets. None of them are the reason a system is specified, and all of them are the reason one fails.",
    variants: [
      {
        code: "KB-AC-CAP",
        label: "Insulation cap, 65 mm",
        note: "Closes a recessed anchor head flush with the board face.",
      },
      {
        code: "KB-AC-TP",
        label: "Expanding window tape, 15 m",
        note: "Seals the system to frames and reveals.",
      },
      {
        code: "KB-AC-ES",
        label: "Screed edge strip, 8 mm × 100 mm",
        note: "Isolates a floating screed from the surrounding structure.",
      },
    ],
    buildUp: null,
  },
];

// System build-up templates, substrate outwards. `self` is the product the
// build-up belongs to; `codeByThickness` picks the matching anchor length.
const buildUps = {
  "etics-mineral": [
    { label: "Adhesive", code: "KB-AD-200", note: "Bead and dab, minimum 40 % contact." },
    {
      label: "Insulation",
      self: true,
      note: "Broken bond pattern, boards tight, no adhesive in the joints.",
    },
    {
      label: "Anchor",
      codeByThickness: "KB-AN-SF",
      note: "Pattern and count per the wind load calculation.",
    },
    {
      label: "Base coat",
      code: "KB-BC-300",
      note: "Two passes, mesh embedded in the upper third.",
    },
    {
      label: "Reinforcement",
      code: "KB-RM-165",
      note: "100 mm overlaps, diagonal patches at opening corners.",
    },
    { label: "Primer", code: "KB-PR-010", note: "Tinted to the render colour." },
    {
      label: "Finish",
      code: "KB-RF-MI-20",
      note: "Mineral render keeps the system Euroclass A1 throughout.",
    },
  ],
  "etics-eps": [
    { label: "Adhesive", code: "KB-AD-200", note: "Bead and dab, minimum 40 % contact." },
    {
      label: "Insulation",
      self: true,
      note: "Broken bond pattern, boards rasped flat before the base coat.",
    },
    {
      label: "Anchor",
      codeByThickness: "KB-AN-SF",
      note: "Pattern and count per the wind load calculation.",
    },
    {
      label: "Base coat",
      code: "KB-BC-300",
      note: "Two passes, mesh embedded in the upper third.",
    },
    {
      label: "Reinforcement",
      code: "KB-RM-165",
      note: "100 mm overlaps, diagonal patches at opening corners.",
    },
    { label: "Primer", code: "KB-PR-010", note: "Tinted to the render colour." },
    {
      label: "Finish",
      code: "KB-RF-SI-15",
      note: "Silicone render, water-repellent and vapour-open.",
    },
  ],
  "flat-roof": [
    { label: "Vapour control", code: "KB-AC-TP", note: "Sealed to upstands and penetrations." },
    {
      label: "Insulation",
      self: true,
      note: "Two layers with staggered joints where the depth allows.",
    },
    { label: "Reinforcement", code: "KB-RM-165", note: "At upstands and detail junctions." },
  ],
  floor: [
    {
      label: "Insulation",
      self: true,
      note: "Laid tight, joints staggered, on a level substrate.",
    },
    {
      label: "Edge isolation",
      code: "KB-AC-ES",
      note: "Full screed depth, at every wall and column.",
    },
  ],
  partition: [
    {
      label: "Cavity insulation",
      self: true,
      note: "Friction fit, cut 10 mm oversize, no compression.",
    },
    { label: "Sealing", code: "KB-AC-TP", note: "Perimeter seal at head, base and abutments." },
  ],
  "pitched-between": [
    {
      label: "Between-rafter insulation",
      self: true,
      note: "Friction fit, full depth, no gaps at the eaves.",
    },
    {
      label: "Sealing",
      code: "KB-AC-TP",
      note: "Vapour control layer taped at every lap and penetration.",
    },
  ],
  "pitched-over": [
    {
      label: "Over-rafter insulation",
      self: true,
      note: "Tongue and groove joints, staggered, fixed through to the rafters.",
    },
    {
      label: "Fixing",
      code: "KB-AN-SF-215",
      note: "Through-fixed to rafters at counter batten centres.",
    },
    { label: "Sealing", code: "KB-AC-TP", note: "Laps taped where the board is the air barrier." },
  ],
};

// ---------------------------------------------------------------------------
// Expansion
// ---------------------------------------------------------------------------
const products = [];
let dopCounter = 100;

const anchorForThickness = (t) => {
  const sizes = [
    [60, "KB-AN-SF-095"],
    [80, "KB-AN-SF-115"],
    [100, "KB-AN-SF-135"],
    [140, "KB-AN-SF-175"],
    [999, "KB-AN-SF-215"],
  ];
  return sizes.find(([max]) => t <= max)[1];
};

const buildComponents = (family, thickness, selfCode) => {
  if (!family.buildUp) return [];
  return buildUps[family.buildUp].map((layer, i) => ({
    position: i + 1,
    layer_label: layer.label,
    component_code: layer.self
      ? selfCode
      : layer.codeByThickness
        ? anchorForThickness(thickness ?? 100)
        : layer.code,
    note: layer.note,
  }));
};

const documentsFor = (product, family) => {
  const year = 2025;
  const docs = [
    {
      kind: "dop",
      title: `Declaration of Performance — ${product.name}`,
      reference: product.dop_number,
      issued_on: `${year}-03-14`,
      url: null,
    },
    {
      kind: "datasheet",
      title: `Technical datasheet — ${family.name}`,
      reference: `TDS-${family.codeBase}`,
      issued_on: `${year}-05-02`,
      url: null,
    },
    {
      kind: "ce",
      title: `CE marking information — ${product.standard}`,
      reference: `CE-${product.code}`,
      issued_on: `${year}-03-14`,
      url: null,
    },
  ];
  if (product.epd_available) {
    docs.push({
      kind: "epd",
      title: `Environmental Product Declaration — ${family.name}`,
      reference: `EPD-KB-${String(dopCounter).padStart(4, "0")}`,
      issued_on: `${year}-01-20`,
      url: null,
    });
  }
  return docs;
};

let sortOrder = 0;

for (const family of families) {
  const category = categories.find((c) => c.slug === family.category);
  if (!category) throw new Error(`Unknown category ${family.category} on family ${family.key}`);

  const variants = family.thicknesses
    ? family.thicknesses.map((t) => ({ thickness: t }))
    : family.variants;

  for (const variant of variants) {
    dopCounter += 1;
    sortOrder += 1;

    const thickness = variant.thickness ?? null;
    const code = variant.code ?? `${family.codeBase}-${String(thickness).padStart(3, "0")}`;
    const name =
      thickness !== null ? `${family.name} ${thickness} mm` : `${family.name} ${variant.label}`;
    const spec = family.spec ?? {};

    const product = {
      slug: slugify(name),
      code,
      name,
      family: family.key,
      family_name: family.name,
      category_slug: family.category,
      summary: family.summary,
      description: family.description,
      standard: family.standard,
      dop_number: `DoP KB-${String(dopCounter).padStart(4, "0")}:2025`,
      ce_marked: true,
      thermal_conductivity: spec.lambda ?? null,
      reaction_to_fire: family.fire,
      fire_rank: FIRE_RANK[family.fire],
      compressive_strength_kpa: spec.cs ?? null,
      vapour_resistance_mu: variant.mu ?? spec.mu ?? null,
      density_kgm3: spec.density ?? null,
      thickness_mm: thickness,
      acoustic_rw_db:
        thickness !== null && family.rwByThickness
          ? (family.rwByThickness[thickness] ?? null)
          : null,
      epd_available: family.epd,
      format_mm: variant.format ?? spec.format ?? null,
      consumption: variant.consumption ?? null,
      substrates: family.substrates,
      texture_key: family.texture,
      variant_label: variant.label ?? (thickness !== null ? `${thickness} mm` : null),
      variant_note: variant.note ?? null,
      applications: family.applications.map(([slug, is_primary]) => ({ slug, is_primary })),
      sort_order: sortOrder,
    };

    product.components = buildComponents(family, thickness, code);
    product.documents = documentsFor(product, family);
    products.push(product);
  }
}

// Fail here rather than on a broken join at seed time.
const codes = new Set(products.map((p) => p.code));
const slugs = new Set(products.map((p) => p.slug));
if (codes.size !== products.length) throw new Error("Duplicate product code");
if (slugs.size !== products.length) throw new Error("Duplicate product slug");
for (const p of products) {
  for (const c of p.components) {
    if (c.component_code && !codes.has(c.component_code)) {
      throw new Error(`${p.code} references unknown component ${c.component_code}`);
    }
  }
  for (const a of p.applications) {
    if (!applications.some((x) => x.slug === a.slug)) {
      throw new Error(`${p.code} references unknown application ${a.slug}`);
    }
  }
}

const catalogue = {
  manufacturer: {
    name: "Kernbau",
    legal_name: "Kernbau Bausysteme GmbH",
    note: "Fictional manufacturer. Every declared value in this file is invented; the units, standards and document formats follow real practice.",
  },
  generated_at: new Date().toISOString().slice(0, 10),
  categories,
  applications,
  products,
};

writeFileSync(OUT, JSON.stringify(catalogue, null, 2) + "\n");
console.log(
  `catalogue.json: ${products.length} products, ${categories.length} categories, ${applications.length} applications`,
);
