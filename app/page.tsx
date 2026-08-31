import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CaretDown } from "@phosphor-icons/react/dist/ssr";
import type { BuildUp } from "@/lib/catalogue";
import {
  getApplications,
  getBuildUp,
  getCatalogueStats,
  getCategories,
  getFamilies,
} from "@/lib/catalogue";
import { assess, SUBSTRATES, worstFire } from "@/lib/build-up";
import { applicationImage, texture, type Texture } from "@/lib/media";
import Constructions from "@/components/constructions";
import CatalogueOpening from "@/components/catalogue-opening";
import DraftingSheet from "@/components/drafting-sheet";
import RollNumber from "@/components/roll-number";
import BuildLoop, { DEPTHS } from "@/components/build-loop";
import { Container } from "@/components/section";
import { Enter, Reveal } from "@/components/motion";

// Rendered per request: the catalogue lives in Postgres, which does not exist
// at build time inside Docker.
export const dynamic = "force-dynamic";

type Stats = { products: number; categories: number; applications: number };
type Row = { label: string; href: string };
type Way = {
  title: string;
  lead: string;
  image: Texture;
  rows: Row[];
  cta: { label: string; href: string };
};

export default async function HomePage() {
  const [stats, categories, families, applications, buildUp] = await Promise.all([
    getCatalogueStats(),
    getCategories(),
    getFamilies(4),
    getApplications(),
    getBuildUp(),
  ]);

  // Each way in carries the first few of its own values, and every one of them
  // is a filtered catalogue URL — the same link the search panel and the
  // application pages use, so clicking a name here does what clicking a name
  // anywhere else on the site does.
  const ways: Way[] = [
    {
      title: "Materials",
      lead: "What a product is made of decides how it behaves in a fire and how deep the wall has to get.",
      image: texture("mineral-wool"),
      rows: categories.slice(0, 4).map((category) => ({
        label: category.name,
        href: `/products?category=${category.slug}`,
      })),
      cta: { label: `All ${stats.categories} categories`, href: "/products" },
    },
    {
      title: "Families",
      lead: "One slab, one datasheet, and every thickness it is made in.",
      image: texture("eps"),
      rows: families.map((family) => ({
        label: family.name,
        href: `/products?q=${encodeURIComponent(family.name)}`,
      })),
      cta: { label: `All ${stats.products} products`, href: "/products" },
    },
    {
      title: "Applications",
      lead: "Most specification decisions begin with a construction rather than with a catalogue.",
      image: applicationImage("external-wall"),
      rows: applications.slice(0, 4).map((application) => ({
        label: application.name,
        href: `/products?application=${application.slug}`,
      })),
      cta: { label: `All ${stats.applications} applications`, href: "/#applications" },
    },
  ];

  return (
    <>
      <Hero stats={stats} />

      {/* The three ways in are their own section. Each one carries the first
          few of its own values, because a name that filters the catalogue is
          worth more than a photograph that does not. */}
      <section aria-labelledby="ways-heading" className="py-16 sm:py-20">
        <Container>
          <Reveal className="max-w-[62rem]">
            <p className="label">Browse</p>
            <h2
              id="ways-heading"
              className="display mt-4 max-w-[18ch] scroll-mt-[calc(var(--header-h)+2.5rem)] text-[clamp(2.25rem,5vw,4rem)] leading-[0.98]"
            >
              Three ways to browse the catalogue
            </h2>
            <p className="lead mt-4 max-w-[62ch]">
              Every name below is a filtered catalogue. Start from what the product is made of, from
              the family it belongs to, or from the construction it is going into.
            </p>
          </Reveal>

          <Reveal className="mt-12 sm:mt-14">
            {/* `min-w-0` on the columns: the names under each way are set on one
                line and truncated, and a truncated line still asks the grid for
                its whole width — which on a 320-pixel phone pushed the column
                past the screen and put a sideways scroll on the page. */}
            <ul className="grid gap-10 sm:grid-cols-3 sm:gap-5 lg:gap-8">
              {ways.map((way) => (
                <li key={way.title} className="flex min-w-0 flex-col">
                  {/* The photograph and the argument are not a link. Only the
                      names under them are, because only they go anywhere
                      specific — a heading that quietly means "all of these" is
                      the kind of target you click by accident. */}
                  <div>
                    <div className="media aspect-[16/10] lg:aspect-[3/2]">
                      <Image
                        src={way.image.src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 30vw"
                        className="texture object-cover"
                      />
                    </div>
                    <h3 className="display t-sub mt-4">{way.title}</h3>
                    <p className="way-lead mt-2 text-sm">{way.lead}</p>
                  </div>

                  {/* The rows are the impact: each one narrows the catalogue. */}
                  <ul className="mt-5 mb-6">
                    {way.rows.map((row) => (
                      <li key={row.href} className="border-b rule first:border-t">
                        <Link
                          href={row.href}
                          className="block truncate py-2.5 text-sm hover:text-signal"
                        >
                          {row.label}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* The CTA closes the list rather than floating under it: it
                      is as wide as the rows above it and its arrow sits on the
                      same edge, so the three columns read as three lists that
                      each end in "and the rest of them" instead of as three
                      loose pills.

                      `mt-auto` is the safety net, not the mechanism: the three
                      lists are the same length, so the CTAs already line up,
                      and this only holds them there when a long name wraps. */}
                  <Link href={way.cta.href} className="btn btn-quiet btn-sm btn-row mt-auto">
                    {way.cta.label}
                    <ArrowRight size={14} weight="bold" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <Constructions applications={applications} />

      {/* The other way in, between the two sections it sits between: the
          constructions above start from what is being built, the configurator
          below starts from a wall, and this starts from the figure somebody was
          handed. */}
      <CatalogueOpening />

      <ConfiguratorTrial buildUp={buildUp} />
    </>
  );
}

/**
 * The first screen is a sheet.
 *
 * The paper is ruled in CSS and the drawing sits on it, fitted rather than
 * cropped: the wall this catalogue is about, cut through at scale, dimensioned
 * down the left, called out to the right, and with the sixteen millimetres of
 * skin that decide the finish taken out in a detail balloon and drawn again at
 * four times the size. Along the foot, where a sheet carries its title block,
 * the catalogue states its own extent.
 *
 * Nothing here is decoration standing in for content: every figure in the block
 * is queried and the depths in the drawing are the ones the configurator adds
 * up.
 */
function Hero({ stats }: { stats: Stats }) {
  return (
    <section className="hero">
      {/* Ruled paper, and a wash that keeps the type off it. */}
      <div className="hero-paper" aria-hidden="true" />
      <div className="sheet-wash absolute inset-0 -z-10" aria-hidden="true" />

      <Container className="hero-body">
        <div className="hero-grid">
          <div>
            <Enter>
              <p className="hero-eyebrow">Insulation, reinforcement and render systems</p>
            </Enter>
            <Enter delay={0.06}>
              {/* Broken by hand rather than by width: the name takes the first
                  line and what it makes takes the second, so the break is the
                  same on every screen the two lines fit on. */}
              <h1 className="display hero-title mt-4">
                <span className="block">Kernbau</span>
                <span className="block">building materials</span>
              </h1>
            </Enter>
            <Enter delay={0.14}>
              <p className="hero-lead mt-6 max-w-[46ch] lg:mt-7">
                {stats.products} products across {stats.categories} material categories and{" "}
                {stats.applications} constructions, each with its declared performance. Search by
                value, compare any three, or configure a whole build-up and read its U-value.
              </p>
            </Enter>
            <Enter delay={0.22}>
              <a
                href="#ways-heading"
                className="scroll-cue group mt-7 inline-flex items-center gap-3 text-sm lg:mt-10"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border rule transition-colors group-hover:border-[color:var(--color-edge)]">
                  <CaretDown size={14} weight="bold" aria-hidden="true" />
                </span>
                Browse the catalogue
              </a>
            </Enter>
          </div>

          <Enter delay={0.1} className="hero-figure">
            <DraftingSheet className="hero-drawing" />
          </Enter>

          {/* The title block, along the foot of the sheet where one belongs —
              and it is written after the drawing because that is where it sits
              on a sheet. It only moves above the drawing on a phone, where the
              sheet is a column and the drawing is the tall part of it: CSS
              orders it there, so the reading order stays the drawn one. */}
          <dl className="hero-block">
            <Cell
              term="Products declared"
              value={String(stats.products)}
              note="Every value declared"
              delay={120}
            />
            <Cell
              term="Categories"
              value={String(stats.categories)}
              note="Material by material"
              delay={260}
            />
            <Cell
              term="Constructions"
              value={String(stats.applications)}
              note="Each drawn as a build-up"
              delay={400}
            />
            <Cell term="Sheet" value="01/22" note="External wall · section 1:5" delay={540} />
          </dl>
        </div>
      </Container>
    </section>
  );
}

/** One cell of the hero's title block: a term, a figure, and what it is of. */
function Cell({
  term,
  value,
  note,
  delay,
}: {
  term: string;
  value: string;
  note: string;
  delay: number;
}) {
  return (
    <div className="hero-cell">
      <dt className="label">{term}</dt>
      <dd className="hero-figure-value mono">
        <RollNumber value={value} delay={delay} />
      </dd>
      <dd className="hero-cell-note">{note}</dd>
    </div>
  );
}

/**
 * The configurator, and the last thing the page says.
 *
 * It closes the landing page rather than sitting in the middle of it, because
 * it is the one thing here that is not a list of products: everything above is
 * "here is what we make", and this is "here is the number you actually have to
 * hand in".
 *
 * It is drawn as a sheet, because that is what it produces. A construction
 * drawing is not a picture with a caption — it is a frame containing a figure
 * and a title block that certifies it, and the block is where the scale, the
 * revision and the numbers live. So the section is one sheet: the four
 * decisions ruled as a schedule on the left, the wall building itself on the
 * right, and along the bottom the three figures the schedule produces, set at
 * the size of the thing you are being asked for.
 *
 * Every figure comes from `lib/build-up.ts`, the arithmetic the configurator
 * itself runs, so this cannot advertise a number the tool would not produce.
 */
function ConfiguratorTrial({ buildUp }: { buildUp: BuildUp }) {
  // The drawing steps through three fixed depths, so the family it draws has to
  // be one that is actually made in all three — otherwise the title block would
  // quote a board this catalogue does not sell.
  const has = (b: BuildUp["boards"][number]) =>
    DEPTHS.every((mm) => b.variants.some((v) => v.thicknessMm === mm));
  const board =
    buildUp.boards.find((b) => b.categorySlug === "mineral-wool" && has(b)) ??
    buildUp.boards.find(has) ??
    buildUp.boards[0];
  const substrate = SUBSTRATES[0]!;
  if (!board) return null;

  // The deepest of the three, which is where the drawing finishes.
  const settled = DEPTHS.at(-1)!;
  const { depthMm, u } = assess({
    substrateMm: substrate.mm,
    substrateR: substrate.r,
    thermalConductivity: board.thermalConductivity,
    thicknessMm: settled,
  });
  const fire = worstFire([board.reactionToFire, buildUp.adhesive?.reactionToFire ?? null]);
  const render = buildUp.renders[0];

  // The four decisions the tool actually asks for, in the order it asks.
  const decisions = [
    { term: "Substrate", value: substrate.name, note: substrate.note },
    { term: "Board", value: board.familyName, note: `λD ${board.thermalConductivity.toFixed(3)}` },
    { term: "Depth", value: `${DEPTHS.join(" → ")} mm`, note: `${board.variants.length} made` },
    {
      term: "Finish",
      value: render?.familyName ?? "Thin-coat render",
      note: render?.code ?? "EN 15824",
    },
  ];

  return (
    <section aria-labelledby="configurator-heading">
      <Container className="py-16 sm:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <p className="label">Configurator</p>
          <p className="label">Sheet 04 · external wall · ETICS</p>
        </div>

        {/* The section's own heading, and the "or" in it is load-bearing: this
            is the alternative to the five drawn applications above. Set at the
            same size as theirs, because it is the same kind of claim, and left
            to run to its own length: it is one line of type and it is broken
            only by a screen too narrow to hold it. */}
        <h2
          id="configurator-heading"
          className="display mt-5 text-[clamp(2.25rem,5vw,4rem)] leading-[0.98]"
        >
          Configure the wall, not the board
        </h2>

        <div className="plate mt-6 sm:mt-7">
          {/* The sheet's own head: what the tool asks, and why. It runs the
              width of the sheet below `lg`, where the schedule and the drawing
              share the two flanks under it, and takes the left flank above it,
              where the drawing has a column of its own. */}
          <div className="plate-head">
            <h3 className="display t-page max-w-[20ch]">Substrate, board, depth, finish</h3>
            <p className="lead mt-4 max-w-[48ch]">
              The figure a specifier is asked for is the wall’s, and it is printed on no board in
              this catalogue: depth and U-value belong to the build-up.
            </p>
          </div>

          {/* The schedule is the argument — four rows, and both figures under
              it move when any of them does. */}
          <dl className="plate-schedule">
            {decisions.map((decision, i) => (
              <div key={decision.term} className="plate-row">
                <span className="mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <dt className="label">{decision.term}</dt>
                <dd className="text-sm">
                  {decision.value}
                  <span className="mono ml-2 text-xs text-muted">{decision.note}</span>
                </dd>
              </div>
            ))}
          </dl>

          {/* The same four decisions, drawn. */}
          <div className="plate-figure">
            <BuildLoop thermalConductivity={board.thermalConductivity} />
          </div>

          {/* The title block. Three figures and the way in, each in a cell of
              its own, ruled off from the cell before it. */}
          <dl className="plate-block">
            <Figure term={`Wall depth at ${settled} mm`} value={String(depthMm)} unit="mm" />
            <Figure term="U-value" value={u.toFixed(3)} unit={"W/(m²K)"} />
            <Figure term="Reaction to fire" value={fire} unit="EN 13501-1" />
            <div className="plate-cell plate-act">
              <Link href="/configurator" className="btn btn-primary btn-row">
                Open the configurator
                <ArrowRight size={15} weight="bold" aria-hidden="true" />
              </Link>
              <Link href="/products?application=external-wall" className="link mt-3 text-xs">
                Or browse the external wall catalogue
              </Link>
            </div>
          </dl>
        </div>

        <p className="caption mt-4 max-w-[76ch]">
          The drawing steps through {DEPTHS.join(", ")} mm of {board.familyName} on{" "}
          {substrate.name.toLowerCase()}; the block reads the deepest of them. Every figure in the
          block is the one the configurator itself computes, so nothing here is a number the tool
          would not produce.
        </p>
      </Container>
    </section>
  );
}

/** One cell of the title block: a small term over a large measured figure. */
function Figure({ term, value, unit }: { term: string; value: string; unit: string }) {
  return (
    <div className="plate-cell">
      <dt className="label">{term}</dt>
      <dd className="mt-2 flex items-baseline gap-1.5">
        <span className="mono plate-value">{value}</span>
        <span className="mono text-xs text-muted">{unit}</span>
      </dd>
    </div>
  );
}
