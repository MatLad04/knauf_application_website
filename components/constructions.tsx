import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Application } from "@/lib/catalogue";
import ConstructionSheet from "./construction-sheet";
import SheetIndex from "./sheet-index";
import { Container } from "./section";
import { Reveal } from "./motion";

type App = Application & { productCount: number };

/**
 * The constructions, and the argument for why they are the way in.
 *
 * This was a page of its own, and the landing page made its argument without
 * the evidence — a claim about build-ups above the fold and the five actual
 * build-ups behind a navigation item most visitors never opened. It is one
 * section now: the title, the sheet list, and then the five constructions, each
 * drawn as the stack it is approved as.
 *
 * `/applications` still resolves; it redirects here, because the URL was
 * shareable and the sitemap had it.
 */
export default function Constructions({ applications }: { applications: App[] }) {
  return (
    <section id="applications" aria-labelledby="constructions-heading">
      <Container>
        {/* One grid for the whole section, so the register can be pinned beside
            the sheets it indexes rather than left behind at the top of them.
            Wide enough for a rail it takes the second column and travels; below
            that it sits under the head, where a contents list normally goes. */}
        <div className="constructions">
          <div className="constructions-head">
            <div className="constructions-head-grid">
              <div className="sm:col-span-2">
                <p className="label">Applications</p>
                <h2
                  id="constructions-heading"
                  className="display mt-5 max-w-[18ch] text-[clamp(2.25rem,5vw,4rem)] leading-[0.98]"
                >
                  Five applications, layer by layer
                </h2>
              </div>

              <p className="lead sm:col-start-1">
                A specification starts from what is being built, not from a catalogue. Each
                construction below is drawn as the build-up it is approved as, in installation
                order, with the Kernbau products approved for it one click away.
              </p>
              <p className="text-sm leading-relaxed text-muted sm:col-start-2">
                The order matters as much as the products in it: a system is assessed as a whole
                under ETAG 004, so a layer swapped for an equivalent-looking one is a different
                system — which is why the catalogue filters by construction and not only by
                material.
              </p>
            </div>
          </div>

          <SheetIndex applications={applications} />

          {/* One construction to a sheet, and each one is its own client
              component because the list and the drawing on it answer each other
              on hover. */}
          <div className="constructions-sheets">
            {applications.map((application, i) => (
              <ConstructionSheet
                key={application.slug}
                application={application}
                flip={i % 2 === 1}
              />
            ))}

            <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 pt-14 sm:pt-16">
              <div>
                <h3 className="display t-sub">Starting from a requirement instead</h3>
                <p className="lead mt-3 max-w-[58ch]">
                  If the constraint is a number rather than a construction — a λD, a Euroclass, a
                  depth you cannot exceed — the catalogue filters on every declared value directly.
                </p>
              </div>
              <Link href="/products" className="btn btn-quiet btn-sm shrink-0">
                Search all products
                <ArrowRight size={14} weight="bold" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
