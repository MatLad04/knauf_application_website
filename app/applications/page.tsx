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
    "Start from the situation rather than the product: external wall, pitched roof, flat roof, floor and internal partition, with the Kernbau products approved for each.",
  alternates: { canonical: "/applications" },
};

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <>
      <section className="border-b rule" aria-labelledby="applications-heading">
        <Container className="py-12 sm:py-16">
          <h1 id="applications-heading" className="display text-[clamp(2rem,4.5vw,3.25rem)]">
            Start from the situation
          </h1>
          <p className="mt-5 max-w-[58ch] text-lg text-muted">
            Most specification decisions begin with a construction, not a catalogue. Pick the one
            you are detailing and the list narrows to what is approved for it.
          </p>
        </Container>
      </section>

      <Container className="py-14">
        <Reveal>
          <ol className="grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
            {applications.map((application) => {
              const image = applicationImage(application.imageKey);
              return (
                <li key={application.slug}>
                  <Link
                    href={`/applications/${application.slug}`}
                    className="card group relative block h-full"
                  >
                    <div className="media aspect-[16/10]">
                      <Image
                        src={image.src}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="texture object-cover"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-4 pt-5">
                      <h2 className="display text-xl group-hover:text-signal">
                        {application.name}
                      </h2>
                      <span className="mono shrink-0 text-xs text-muted">
                        {application.productCount} products
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm text-muted">{application.summary}</p>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Reveal>

        <Reveal className="mt-16 border-t rule pt-10 text-center">
          <p className="display text-[clamp(1.375rem,2.6vw,1.875rem)]">Not sure which</p>
          <p className="mt-3 text-muted">
            Filter the whole catalogue by declared performance instead.
          </p>
          <Link href="/products" className="btn btn-quiet group mt-6">
            Open the catalogue
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
