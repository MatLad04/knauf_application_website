import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getApplications } from "@/lib/catalogue";
import { applicationImage } from "@/lib/media";
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

  return (
    <>
      {/* The argument the page exists to make, at the size of the page. It is
          one sentence, so it gets the screen rather than a paragraph slot. */}
      <section className="relative overflow-hidden border-b rule" aria-labelledby="apps-heading">
        <Container className="flex min-h-[62svh] flex-col justify-end py-16 sm:py-24">
          <p className="label">Applications</p>
          <h1
            id="apps-heading"
            className="display mt-6 max-w-[18ch] text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95]"
          >
            A wall is not a
            <br />
            shelf of products
          </h1>
          <p className="mt-8 max-w-[54ch] text-lg text-muted sm:text-xl">
            Most specification decisions begin with a construction rather than with a catalogue.
            Nobody sets out to buy a board: they set out to build an external wall that holds a
            U-value and a fire class, and the board is one of seven things that gets them there.
          </p>
        </Container>
      </section>

      {/* One construction to a band, alternating, with the build-up as the
          object. A photograph and a list of layers say what a construction is
          faster than a card grid does — the grid was five identical cards. */}
      {applications.map((application, i) => {
        const image = applicationImage(application.imageKey);
        const flip = i % 2 === 1;

        return (
          <section
            key={application.slug}
            aria-labelledby={`app-${application.slug}`}
            className="border-b rule"
          >
            <Container className="py-16 sm:py-24">
              <Reveal>
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
                  <div className={flip ? "lg:order-2" : undefined}>
                    <div className="flex items-baseline gap-5">
                      <span className="mono text-sm text-muted">
                        {String(application.indexNo).padStart(2, "0")}
                      </span>
                      <h2
                        id={`app-${application.slug}`}
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
                          key={layer}
                          className="flex items-baseline gap-5 border-b rule py-3 first:border-t"
                        >
                          <span className="mono text-xs text-muted">
                            {String(n + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm sm:text-base">{layer}</span>
                        </li>
                      ))}
                    </ol>

                    <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <Link
                        href={`/applications/${application.slug}`}
                        className="btn btn-primary group"
                      >
                        The build-up in detail
                        <ArrowRight
                          size={16}
                          weight="bold"
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </Link>
                      <Link
                        href={`/products?application=${application.slug}`}
                        className="link text-sm"
                      >
                        {application.productCount} products approved for it
                      </Link>
                    </div>
                  </div>

                  <div className={flip ? "lg:order-1" : undefined}>
                    <div className="media aspect-[4/3]">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 46rem"
                        className="texture object-cover"
                      />
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
          <Link href="/products" className="btn btn-quiet group mt-8">
            Search all products
            <ArrowRight
              size={16}
              weight="bold"
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </Reveal>
      </Container>
    </>
  );
}
