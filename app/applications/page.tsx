import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { getApplications } from "@/lib/catalogue";
import { applicationImage } from "@/lib/media";
import ConstructionFigure from "@/components/construction-figure";
import { Container } from "@/components/section";
import { Reveal } from "@/components/motion";

// Rendered per request: the catalogue lives in Postgres, which does not exist
// at build time inside Docker.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Applications",
  description:
    "Most specification decisions begin with a construction, not a catalogue. External wall, pitched roof, flat roof, floor and internal partition, each with the layers it is approved as and the Kernbau products that make them.",
  alternates: { canonical: "/applications" },
};

export default async function ApplicationsPage() {
  const applications = await getApplications();
  const deepest = applications.reduce((a, b) => (a.buildUp.length >= b.buildUp.length ? a : b));

  return (
    <>
      {/* The argument the page exists to make, at the size of the page, over
          the index of what is on it — the way a drawing set opens on a sheet
          list rather than on the first sheet. */}
      <section className="border-b rule" aria-labelledby="apps-heading">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div>
              <p className="label">Applications</p>
              <h1
                id="apps-heading"
                className="display mt-6 max-w-[16ch] text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95]"
              >
                A wall is not a shelf of products
              </h1>
              <p className="mt-8 max-w-[54ch] text-lg text-muted sm:text-xl">
                Most specification decisions begin with a construction rather than with a catalogue.
                Nobody sets out to buy a board: they set out to build an external wall that holds a
                U-value and a fire class, and the board is one of {deepest.buildUp.length} things
                that gets them there.
              </p>
            </div>

            {/* The sheet list. Five constructions, the depth of each build-up,
                and what is approved for it — the whole page in one block. */}
            <nav aria-label="Constructions on this page" className="lg:pt-3">
              <p className="lane-title inline-block">Sheet list</p>
              <ul className="mt-4">
                {applications.map((application) => (
                  <li key={application.slug} className="border-b rule first:border-t">
                    <a
                      href={`#app-${application.slug}`}
                      className="flex items-baseline gap-4 py-3 text-sm hover:text-signal"
                    >
                      <span className="mono text-xs text-muted">
                        {String(application.indexNo).padStart(2, "0")}
                      </span>
                      <span className="flex-1">{application.name}</span>
                      <span className="mono text-xs text-muted">
                        {application.buildUp.length} layers
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </Container>
      </section>

      {/* One construction to a sheet: the build-up drawn as a stack of layers
          at the depth each one is, the photograph beside it, and the products
          approved for it one click away. A card grid could not say any of
          that — it said the same thing five times. */}
      {applications.map((application, i) => {
        const image = applicationImage(application.imageKey);
        const flip = i % 2 === 1;

        return (
          <section
            key={application.slug}
            id={`app-${application.slug}`}
            aria-labelledby={`app-${application.slug}-heading`}
            className="border-b rule scroll-mt-[calc(var(--header-h)+1rem)]"
          >
            <Container className="py-16 sm:py-24">
              <Reveal>
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                  <div className={flip ? "lg:order-2 lg:pl-8" : undefined}>
                    <div className="flex items-baseline gap-5">
                      <span className="mono text-sm text-muted">
                        {String(application.indexNo).padStart(2, "0")}
                      </span>
                      <h2
                        id={`app-${application.slug}-heading`}
                        className="display text-[clamp(1.75rem,4vw,3rem)]"
                      >
                        {application.name}
                      </h2>
                    </div>

                    <p className="mt-5 max-w-[52ch] text-lg text-muted">{application.summary}</p>

                    {/* The build-up in installation order. This is the thing a
                        catalogue cannot tell you and the reason to start here. */}
                    <ol className="mt-9 max-w-[34rem]">
                      {application.buildUp.map((layer, n) => (
                        <li
                          key={`${n}-${layer}`}
                          className="flex items-center gap-5 border-b rule py-3 first:border-t"
                        >
                          <span className="mono w-6 shrink-0 text-xs text-muted">
                            {String(n + 1).padStart(2, "0")}
                          </span>
                          <span
                            aria-hidden="true"
                            className="layer-rule"
                            style={{ "--depth": `${18 + ((n * 37) % 62)}%` } as React.CSSProperties}
                          />
                          <span className="text-sm sm:text-base">{layer}</span>
                        </li>
                      ))}
                    </ol>

                    {/* One way on, and it goes where the reader is actually
                        headed. A page about the build-up in between was a stop
                        on the way to the same catalogue, so the note that used
                        to live on it is on the back of the photograph instead
                        and this goes straight to the products. */}
                    <Link
                      href={`/products?application=${application.slug}`}
                      className="btn btn-primary mt-9"
                    >
                      All {application.productCount} approved products
                      <ArrowRight size={16} weight="bold" aria-hidden="true" />
                    </Link>
                  </div>

                  {/* The photograph turns over. What was a second page is a
                      second face: the longer note about the construction, on
                      the back of the thing it describes. Focusable, so it is
                      reachable without a pointer, and on a touch screen the
                      note simply sits under the photograph instead. */}
                  <div
                    tabIndex={0}
                    role="group"
                    aria-label={`${application.name} — turn for the detail`}
                    className={`turn ${flip ? "lg:order-1" : ""}`}
                  >
                    <div className="turn-inner">
                      <div className="media turn-face aspect-[4/3]">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(max-width: 1024px) 100vw, 46rem"
                          priority={i === 0}
                          className="texture object-cover"
                        />
                        <span className="turn-hint">
                          <ArrowsClockwise size={13} weight="bold" aria-hidden="true" />
                          Hover for the detail
                        </span>
                      </div>

                      <div className="turn-face turn-back">
                        <p className="label">{application.name}</p>
                        <p className="mt-3 text-sm text-muted">{application.description}</p>

                        {/* The construction itself, cut. A paragraph about a
                            build-up over an empty half-card was the one place
                            on this site where a drawing was obviously missing. */}
                        <div className="turn-figure">
                          <ConstructionFigure application={application.slug} />
                        </div>

                        <p className="mono text-xs text-muted">
                          {application.productCount} products approved ·{" "}
                          {application.buildUp.length} layers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </Container>
          </section>
        );
      })}

      <Container className="py-20 sm:py-28">
        <Reveal className="mx-auto max-w-[46rem] text-center">
          <h2 className="display text-[clamp(1.5rem,3vw,2.25rem)]">Starting from a requirement</h2>
          <p className="mt-4 text-muted">
            If the constraint is a number rather than a construction — a λD, a Euroclass, a depth
            you cannot exceed — the catalogue filters on every declared value directly.
          </p>
          <Link href="/products" className="btn btn-quiet mt-8">
            Search all products
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </Reveal>
      </Container>
    </>
  );
}
