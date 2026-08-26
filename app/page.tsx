import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { getCatalogueStats } from "@/lib/catalogue";
import { applicationImage, HERO_IMAGE, texture } from "@/lib/media";
import DraftingSheet from "@/components/drafting-sheet";
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

const WAYS = [
  {
    title: "Materials",
    lead: "What a product is made of decides how it behaves in a fire and how deep the wall has to get.",
    image: texture("mineral-wool"),
    cta: (s: Stats) => ({ label: `All ${s.categories} categories`, href: "/products" }),
  },
  {
    title: "Families",
    lead: "A family is one datasheet and one photograph across every thickness it is made in.",
    image: texture("eps"),
    cta: (s: Stats) => ({ label: `All ${s.products} products`, href: "/products" }),
  },
  {
    title: "Systems",
    lead: "Most specification decisions begin with a construction rather than with a catalogue.",
    image: applicationImage("external-wall"),
    cta: (s: Stats) => ({ label: `All ${s.applications} applications`, href: "/applications" }),
  },
];

export default async function HomePage() {
  const stats = await getCatalogueStats();

  return (
    <>
      <Hero stats={stats} />

      {/* The three ways in are their own section now. In the hero they were an
          unannounced row of photographs under a headline about something else;
          here they are introduced, which is the difference between a set of
          choices and some pictures. */}
      <section aria-labelledby="ways-heading" className="border-t rule py-16 sm:py-20">
        <Container>
          <Reveal className="grid items-end gap-x-12 gap-y-5 lg:grid-cols-2">
            <div>
              <p className="label">Where to start</p>
              <h2 id="ways-heading" className="display mt-4 text-[clamp(1.75rem,3.6vw,2.75rem)]">
                Three ways into the catalogue
              </h2>
            </div>
            <p className="max-w-[52ch] text-muted lg:pb-1">
              A specification starts from what the product is made of, from the family it belongs
              to, or from the construction it is going into. All three are one keystroke away in the
              search bar.
            </p>
          </Reveal>

          <Reveal className="mt-12 sm:mt-14">
            <ul className="grid gap-6 sm:grid-cols-3 sm:gap-5 lg:gap-8">
              {WAYS.map((way) => {
                const cta = way.cta(stats);
                return (
                  <li key={way.title}>
                    <Link href={cta.href} className="way group block">
                      <div className="media aspect-[16/10] lg:aspect-[3/2]">
                        <Image
                          src={way.image.src}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 30vw"
                          className="texture object-cover"
                        />
                      </div>

                      <div className="mt-4 flex items-baseline justify-between gap-4">
                        <h3 className="display text-lg group-hover:text-signal">{way.title}</h3>
                        <span className="caption inline-flex items-center gap-1.5 whitespace-nowrap">
                          {cta.label}
                          <ArrowRight
                            size={13}
                            weight="bold"
                            aria-hidden="true"
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                      </div>
                      <p className="way-lead mt-2 text-sm">{way.lead}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* What the catalogue is actually about: layer order and true thickness.
          The photograph carries it, so the type sits beside it, not over it. */}
      <section aria-labelledby="systems-heading" className="border-t rule py-20 sm:py-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="lg:mx-auto lg:max-w-[34rem]">
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

      {/* The honesty note. It is a footnote and not a feature, so it carries no
          button: the header and the footer already link to the same page. */}
      <section aria-labelledby="honesty-heading" className="border-t rule py-20 sm:py-24">
        <Container>
          <Reveal className="max-w-[52rem]">
            <p className="label">About this prototype</p>
            <h2
              id="honesty-heading"
              className="display mt-4 max-w-[22ch] text-[clamp(1.75rem,3.6vw,2.75rem)]"
            >
              Invented products, real specification framework
            </h2>
            <p className="mt-5 max-w-[68ch] text-muted">
              Kernbau does not exist. Every declared value here is made up and backed by no test
              report. The units, standards and document formats are the ones a real datasheet uses,
              so the interface can be judged honestly.
            </p>
          </Reveal>
        </Container>
      </section>
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
