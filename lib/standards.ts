/**
 * The documents the catalogue declares against.
 *
 * Every product page ends in a row of references — EN 13501-1, EN ISO 6946,
 * ETAG 004 — and until now they were type. They are the reason the numbers on
 * this site mean anything: a declared value is only a value because a document
 * says what was measured, how, and what the result is allowed to be called.
 * Someone reading a datasheet for the first time deserves somewhere to find
 * that out, so each one has a page.
 *
 * The products in this catalogue are invented. These are not. The summaries
 * below describe the real documents, in the terms they actually use, and each
 * page says plainly that it is an orientation rather than the standard itself —
 * which you buy from a national standards body, because that is how they are
 * published.
 */

export type Clause = { code: string; label: string; note: string };
export type Section = { heading: string; body: string[] };

export type Standard = {
  slug: string;
  /** The designation as it is printed on a Declaration of Performance. */
  reference: string;
  title: string;
  kind: string;
  /** The body that publishes it. */
  publisher: string;
  lead: string;
  /** What the document actually decides, in one line each. */
  governs: string[];
  sections: Section[];
  /** A classification the document defines, where it defines one. */
  ladder?: { heading: string; note: string; steps: Clause[] };
  /** Where this document shows up in the catalogue, as real links. */
  appears: { label: string; href: string; note: string }[];
  siblings?: { reference: string; note: string }[];
};

export const STANDARDS: Standard[] = [
  {
    slug: "eu-305-2011",
    reference: "EU 305/2011",
    title: "Construction Products Regulation",
    kind: "Regulation",
    publisher: "European Parliament and Council",
    lead: "The regulation that turns a claim into a declaration. Where a harmonised standard covers a construction product, the manufacturer must draw up a Declaration of Performance and apply the CE marking before placing it on the market — and from that point the product is described by declared values rather than by adjectives.",
    governs: [
      "Which products need a Declaration of Performance at all",
      "What a Declaration of Performance has to contain",
      "What the CE marking on a construction product means",
      "Which characteristics a manufacturer must declare, and in what units",
    ],
    sections: [
      {
        heading: "Declared performance, not fitness for purpose",
        body: [
          "A Declaration of Performance says what a product does, measured to a stated method. It does not say the product is right for your building. That judgement belongs to the specifier, working from the national requirements that apply where the building is — which is why the same board can be perfectly compliant and completely wrong for a job.",
          "This is the distinction the whole catalogue is built around. Every figure on a product page is a declared value with a standard beside it; none of them is a recommendation.",
        ],
      },
      {
        heading: "Essential characteristics",
        body: [
          "The harmonised standard for a product family lists the characteristics that can be declared. The manufacturer must declare at least one, and must declare every characteristic the member state requires for the intended use. Anything not declared is stated as NPD — no performance determined — which is itself information: it means the value was never established, not that it is poor.",
          "For insulation the characteristics that decide most specifications are thermal conductivity, reaction to fire, thickness and its tolerance class, compressive stress and water vapour diffusion resistance.",
        ],
      },
      {
        heading: "Where it is going",
        body: [
          "Regulation (EU) 2024/3110 was adopted to replace 305/2011, and entered into force in January 2025 with a long transition. During it, products covered by existing harmonised standards continue to be declared and CE-marked under 305/2011. Both regimes keep the same idea at the centre: the manufacturer declares, the declaration is public, and the specifier compares like with like.",
        ],
      },
    ],
    appears: [
      {
        label: "Every product carries a DoP number",
        href: "/products",
        note: "The reference under the code on each product page is its Declaration of Performance.",
      },
      {
        label: "Products with an environmental declaration",
        href: "/products?epd=1",
        note: "An EPD is a separate document from a DoP, and only some products have one.",
      },
    ],
  },

  {
    slug: "en-13501-1",
    reference: "EN 13501-1",
    title: "Fire classification of construction products — reaction to fire",
    kind: "Classification standard",
    publisher: "CEN",
    lead: "The Euroclass system. It takes the results of the European reaction-to-fire tests and turns them into a single class from A1 to F, with two sub-classes for what the material does besides burn: how much smoke it makes, and whether it drips.",
    governs: [
      "The Euroclass a product may be described by",
      "Which tests a class has to be established from",
      "The smoke sub-classes s1 to s3",
      "The flaming droplet sub-classes d0 to d2",
    ],
    sections: [
      {
        heading: "One class, two sub-classes",
        body: [
          "A full classification reads like B-s1,d0: the letter is the contribution to fire, s is smoke production, d is flaming droplets and particles. A1 carries no sub-classes, because a material that makes no contribution to a fire has nothing to qualify.",
          "The sub-classes are not decoration. In an escape route, smoke is usually what decides the outcome, and s3 next to s1 is a different product for that purpose even where the letter is the same.",
        ],
      },
      {
        heading: "Why it rules products in and out",
        body: [
          "Above a certain building height most national rules stop accepting combustible insulation in an external wall, and the line is drawn on this classification. That is why reaction to fire is the one characteristic in this catalogue that can be filtered on its own and why it is printed on the card rather than inside it.",
          "It is a classification of the product as tested, in the end-use conditions the test represents. A system containing that product is assessed separately — see ETAG 004.",
        ],
      },
    ],
    ladder: {
      heading: "The Euroclass ladder",
      note: "Best first. Every insulation product in this catalogue is declared somewhere on it.",
      steps: [
        { code: "A1", label: "No contribution to fire", note: "Non-combustible. No sub-classes." },
        { code: "A2", label: "Virtually no contribution", note: "Non-combustible in practice." },
        { code: "B", label: "Very limited contribution", note: "Combustible, hard to ignite." },
        { code: "C", label: "Limited contribution", note: "Combustible." },
        { code: "D", label: "Acceptable contribution", note: "Combustible." },
        { code: "E", label: "Acceptable reaction", note: "Passes a small flame test only." },
        { code: "F", label: "No performance determined", note: "Untested, or failed E." },
      ],
    },
    appears: [
      {
        label: "Filter the catalogue by Euroclass",
        href: "/products?fire=A1",
        note: "The A1 products: mineral wool, and the mineral adhesives and renders.",
      },
      {
        label: "Reaction to fire on every product page",
        href: "/products",
        note: "One of the four headline values, and the one printed on the card.",
      },
    ],
  },

  {
    slug: "en-13162",
    reference: "EN 13162",
    title: "Factory made mineral wool products — specification",
    kind: "Harmonised product standard",
    publisher: "CEN",
    lead: "The product standard for mineral wool insulation: what a manufacturer is allowed to declare about a board, how each value is established, and how the board is marked. It is the document that makes one manufacturer's 0.035 comparable with another's.",
    governs: [
      "The declared thermal conductivity λD and how it is derived",
      "Thickness tolerance classes",
      "Dimensional stability, compressive stress and tensile strength",
      "Water absorption and water vapour diffusion resistance",
      "The designation code printed on the product",
    ],
    sections: [
      {
        heading: "Declared, not measured",
        body: [
          "λD is not the result of one test on one board. It is a declared value derived statistically from measured conductivity, set so that at least 90 per cent of production falls below it with 90 per cent confidence, and then rounded upwards to the nearest 0.001 W/(m·K).",
          "That is why every board in a family shares one figure across every thickness, and why comparing two products on λD is a fair comparison rather than a comparison of two laboratories on two days.",
        ],
      },
      {
        heading: "The designation code",
        body: [
          "A mineral wool board carries a code that packs its declared levels into one string — MW-EN 13162-T5-DS(70,90)-CS(10)70-TR15-WS-MU1. It is dense, and it is complete: a merchant can read a board's declared class for every characteristic off the label without a datasheet.",
          "This catalogue does not print those strings. It prints the characteristics they encode, one to a row, because a specification decision is made on a value rather than on a code.",
        ],
      },
    ],
    siblings: [
      { reference: "EN 13163", note: "Expanded polystyrene (EPS)" },
      { reference: "EN 13164", note: "Extruded polystyrene (XPS)" },
      { reference: "EN 13171", note: "Wood fibre" },
      { reference: "EN 998-1", note: "Rendering and plastering mortars" },
      { reference: "EN 15824", note: "Organic renders and plasters" },
    ],
    appears: [
      {
        label: "The mineral wool in this catalogue",
        href: "/products?category=mineral-wool",
        note: "Every one of them is declared against this standard.",
      },
      {
        label: "The rigid boards, declared against its siblings",
        href: "/products?category=rigid-boards",
        note: "EPS to EN 13163, XPS to EN 13164 — the same structure, a different material.",
      },
    ],
  },

  {
    slug: "en-iso-6946",
    reference: "EN ISO 6946",
    title: "Thermal resistance and thermal transmittance — calculation methods",
    kind: "Calculation standard",
    publisher: "ISO / CEN",
    lead: "How a stack of layers becomes a U-value. It is the arithmetic behind every R and U figure on this site: resistances in series, surface resistances at each face, and the corrections that separate an indicative figure from one you can put on a drawing.",
    governs: [
      "Thermal resistance of a layer, R = d / λ",
      "Total resistance of an assembly, including surface resistances",
      "Thermal transmittance, U = 1 / R_total",
      "Corrections for fixings, air gaps and inhomogeneous layers",
    ],
    sections: [
      {
        heading: "The three lines of arithmetic",
        body: [
          "The resistance of a layer is its thickness in metres divided by its thermal conductivity. The resistance of an assembly is the sum of its layers plus a surface resistance at each face — 0.13 m²K/W inside and 0.04 outside for horizontal heat flow through a wall. The transmittance is the reciprocal of that total.",
          "That is genuinely all of it, and it is what the configurator on this site runs. It is also why the U-value belongs to the wall and not to the board: two thirds of the arithmetic is about things that are not the insulation.",
        ],
      },
      {
        heading: "What makes a figure a specification figure",
        body: [
          "The simple calculation assumes homogeneous layers and no penetrations. A real external wall has anchors through the insulation, joints between boards, and a structure behind it that conducts around the layer. The standard sets out corrections for each, and the corrected result is the one that goes on a drawing.",
          "Every U-value in this catalogue is uncorrected, and every page that prints one says so.",
        ],
      },
    ],
    appears: [
      {
        label: "Build a wall and read its U-value",
        href: "/configurator",
        note: "Four decisions, and the arithmetic above, live.",
      },
      {
        label: "Thermal resistance on every product page",
        href: "/products?category=mineral-wool",
        note: "R for the board alone, from its declared conductivity and thickness.",
      },
    ],
  },

  {
    slug: "etag-004",
    reference: "ETAG 004",
    title: "External thermal insulation composite systems with rendering",
    kind: "Assessment route",
    publisher: "EOTA",
    lead: "The route by which an external wall insulation system is assessed as a system. There is no harmonised product standard for ETICS, so a kit is approved against this document as a whole — adhesive, board, anchor, base coat, mesh and render together — and an approval covers that combination and no other.",
    governs: [
      "Bond strength between every pair of layers in the kit",
      "Impact resistance of the finished surface",
      "Hygrothermal behaviour under heat, rain and freeze-thaw cycling",
      "Wind load resistance of the fixed system",
      "Reaction to fire of the system, as distinct from its parts",
    ],
    sections: [
      {
        heading: "Why a system and not a board",
        body: [
          "The failures that matter in external wall insulation are failures between layers, not failures inside them: a base coat that will not hold a render, an adhesive that lets go of a board, a mesh that tears at a corner. None of those can be found by testing a component on its own, so the kit is tested assembled and approved assembled.",
          "This is the reason every product page in this catalogue carries the build-up it belongs to, in installation order, rather than standing on its own. Substituting one layer for another product with the same declared values does not give you the same approved system — it gives you an unapproved one.",
        ],
      },
      {
        heading: "ETAG 004 as an EAD",
        body: [
          "Under the Construction Products Regulation, ETAGs were converted into European Assessment Documents. ETAG 004 is now used as EAD 040083-00-0404, and an approval issued against it is a European Technical Assessment. The designation most of the trade still says out loud is ETAG 004, which is why it is the one printed here.",
        ],
      },
    ],
    appears: [
      {
        label: "The external wall systems",
        href: "/products?application=external-wall",
        note: "Every product approved for a rendered external wall build-up.",
      },
      {
        label: "Configure a complete build-up",
        href: "/configurator",
        note: "Seven layers, and the four of them that are actually a choice.",
      },
    ],
  },
];

export function standardBySlug(slug: string) {
  return STANDARDS.find((standard) => standard.slug === slug) ?? null;
}

/** The reference as it appears in type, mapped to its page. */
export function standardHref(reference: string) {
  const match = STANDARDS.find(
    (standard) =>
      standard.reference.toLowerCase() === reference.toLowerCase() ||
      reference.toLowerCase().startsWith(standard.reference.toLowerCase()),
  );
  return match ? `/standards/${match.slug}` : null;
}
