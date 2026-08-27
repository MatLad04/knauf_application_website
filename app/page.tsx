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
import { SUBSTRATES } from "@/lib/build-up";
import { applicationImage, HERO_IMAGE, texture, type Texture } from "@/lib/media";
import DraftingSheet from "@/components/drafting-sheet";
import BuildLoop from "@/components/build-loop";
import { Container } from "@/components/section";
import { Enter, Reveal } from "@/components/motion";

// Rendered per request: the catalogue lives in Postgres, which does not exist
// at build time inside Docker.
export const dynamic = "force-dynamic";

const BUILD_UP = [
  "Adhesive mortar",
  "Insulation board",
  "Mechanical anchor",
  "Base coat",
  "Reinforcement mesh",
  "Primer",
  "Thin-coat render",
];

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
      lead: "A family is one datasheet and one photograph across every thickness it is made in.",
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
      cta: { label: `All ${stats.applications} applications`, href: "/applications" },
    },
  ];

  return (
    <>
      <Hero stats={stats} />

      {/* The three ways in are their own section. Each one carries the first
          few of its own values, because a name that filters the catalogue is
          worth more than a photograph that does not. */}
      <section aria-labelledby="ways-heading" className="border-t rule py-16 sm:py-20">
        <Container>
          <Reveal className="max-w-[62rem]">
            <p className="label">Where to start</p>
            <h2 id="ways-heading" className="display mt-4 text-[clamp(1.75rem,3.6vw,2.75rem)]">
              Three ways into the catalogue
            </h2>
            <p className="mt-5 max-w-[62ch] text-lg text-muted">
              A specification starts from what the product is made of, from the family it belongs
              to, or from the construction it is going into. Every name below is a filtered
              catalogue.
            </p>
          </Reveal>

          <Reveal className="mt-12 sm:mt-14">
            <ul className="grid gap-10 sm:grid-cols-3 sm:gap-5 lg:gap-8">
              {ways.map((way) => (
                <li key={way.title} className="flex flex-col">
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
                    <h3 className="display mt-4 text-lg">{way.title}</h3>
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

      {/* What the catalogue is actually about: layer order and true thickness.
          The photograph carries it, so the type sits beside it, not over it. */}
      <section aria-labelledby="systems-heading" className="border-t rule py-20 sm:py-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="lg:max-w-[34rem]">
              <h2 id="systems-heading" className="display text-[clamp(1.75rem,3.6vw,2.75rem)]">
                A board is one layer of seven
              </h2>
              <p className="mt-4 max-w-[46ch] text-muted">
                An insulation board is never installed alone, and it is approved as part of a
                build-up rather than on its own. Every product page carries the system it belongs
                to, in installation order.
              </p>

              <ol className="mt-10">
                {BUILD_UP.map((layer, i) => (
                  <li
                    key={layer}
                    className="flex items-baseline gap-5 border-b rule py-3.5 first:border-t"
                  >
                    <span className="mono text-xs text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium sm:text-base">{layer}</span>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal>
              <div className="media aspect-[4/3]">
                <Image
                  src={HERO_IMAGE.src}
                  alt={HERO_IMAGE.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 46rem"
                  className="texture object-cover"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <ConfiguratorTrial buildUp={buildUp} />
    </>
  );
}

/**
 * The photograph is gone and the drawing is the ground: a section through the
 * wall this catalogue is about, to scale, with its layers dimensioned. The
 * first screen says what the thing is; the section under it says where to go.
 */
function Hero({ stats }: { stats: Stats }) {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-var(--header-h))] flex-col overflow-hidden">
      {/* Drawn in the theme's own ink, so it inverts with the rest of it. */}
      <DraftingSheet className="absolute inset-0 -z-20 h-full w-full" />
      <div className="sheet-wash absolute inset-0 -z-10" aria-hidden="true" />

      {/* Two halves: the type takes the left one and sits centred in it, so it
          reads against the drawing rather than against the edge of the page. */}
      <Container className="grid flex-1 items-center py-20 sm:py-24 lg:grid-cols-2">
        <div className="lg:mx-auto lg:max-w-[34rem]">
          <Enter>
            <h1 className="display max-w-[13ch] text-[clamp(2.5rem,6.5vw,4.75rem)]">
              Every layer, declared
            </h1>
          </Enter>
          <Enter delay={0.1}>
            <p className="mt-6 max-w-[38ch] text-lg text-muted sm:text-xl">
              {stats.products} insulation, reinforcement and render products, declared to the values
              a Declaration of Performance actually carries.
            </p>
          </Enter>
          <Enter delay={0.2}>
            <a
              href="#ways-heading"
              className="scroll-cue group mt-12 inline-flex items-center gap-3 text-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border rule transition-colors group-hover:border-[color:var(--color-edge)]">
                <CaretDown size={14} weight="bold" aria-hidden="true" />
              </span>
              Where to start
            </a>
          </Enter>
        </div>
      </Container>
    </section>
  );
}

/**
 * The configurator, and the last thing the page says.
 *
 * It closes the landing page rather than sitting in the middle of it, because
 * it is the one thing here that is not a list of products: everything above is
 * "here is what we make", and this is "here is the number you actually have to
 * hand in". A closing CTA is also the honest place for it — the footer is next,
 * and a visitor who has read this far is looking for somewhere to go.
 *
 * It sits on the sunken ground rather than the page's, so it reads as a
 * different kind of block from the three sections above it without needing a
 * rule, a border or a colour the rest of the site does not use.
 *
 * The drawing beside it is the argument, moving: the wall goes up in
 * installation order and then steps through three depths, and the depth and the
 * U-value under it change with it. Both figures come from `lib/build-up.ts`,
 * which is the arithmetic the configurator itself runs, so this cannot
 * advertise a number the tool would not produce.
 */
function ConfiguratorTrial({ buildUp }: { buildUp: BuildUp }) {
  const board = buildUp.boards.find((b) => b.categorySlug === "mineral-wool") ?? buildUp.boards[0];
  const substrate = SUBSTRATES[0]!;
  if (!board) return null;

  return (
    <section aria-labelledby="configurator-heading" className="closing">
      <Container className="py-20 sm:py-28 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-20">
          <Reveal className="lg:max-w-[34rem]">
            <p className="label">Configurator</p>

            <h2
              id="configurator-heading"
              className="display mt-5 max-w-[16ch] text-[clamp(2rem,4.6vw,3.5rem)]"
            >
              Configure the wall, not the board
            </h2>

            <p className="mt-6 max-w-[50ch] text-lg text-muted">
              The figure a specifier is asked for is the wall&rsquo;s, and it is printed on no board
              in this catalogue: depth and U-value belong to the build-up. Four decisions —
              substrate, board, depth, finish — and the section is drawn to scale while you make
              them.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/configurator" className="btn btn-primary px-7 py-4 text-base">
                Open the configurator
                <ArrowRight size={17} weight="bold" aria-hidden="true" />
              </Link>
              <Link href="/products?application=external-wall" className="link text-sm">
                Or browse the external wall catalogue
              </Link>
            </div>

            <p className="caption mt-8 max-w-[52ch]">
              Kernbau does not exist and every declared value here is invented. The units, the
              standards and the arithmetic are the ones a real datasheet uses, so the interface can
              be judged honestly.
            </p>
          </Reveal>

          <Reveal>
            <div className="closing-figure">
              <BuildLoop thermalConductivity={board.thermalConductivity} />
            </div>
            <p className="caption mt-4">
              {board.familyName} on {substrate.name.toLowerCase()}. Indicative, and to the same
              arithmetic the configurator runs.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
