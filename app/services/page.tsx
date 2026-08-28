import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import ServiceSketch from "@/components/service-sketch";
import { Container } from "@/components/section";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Services",
  description:
    "What Kernbau does around the products: specification support, U-value and condensation calculation, on-site inspection, CPD training, and samples and mock-ups.",
  alternates: { canonical: "/services" },
};

/**
 * Invented, like everything else here, but invented to the shape of the real
 * thing: these are the five services a manufacturer in this trade actually
 * offers, and each one is described by what it produces rather than by how
 * helpful it is.
 *
 * They are ordered the way a job runs — specify, calculate, build, learn from
 * it, hold it in your hand — which is what earns the line down the middle of
 * the page. Five unrelated offers would not deserve one.
 */
const SERVICES = [
  {
    title: "Specification support",
    stage: "Before the drawing is issued",
    sketch: "specification",
    lead: "A written specification for the build-up you are detailing.",
    body: "Send a drawing or an outline and get back the layers in installation order, the products that carry the declared values you need, and the standards each is declared against. Issued as a document you can put in a tender, not as an email.",
    deliverable: "A specification document you can put in a tender",
    turnaround: "2 days",
  },
  {
    title: "U-value and condensation calculation",
    stage: "Before the design is fixed",
    sketch: "dewpoint",
    lead: "The number the build-up actually reaches, and where the dew point sits.",
    body: "Thermal transmittance to EN ISO 6946 and interstitial condensation to EN ISO 13788, calculated on the declared conductivities of the products in the system rather than on nominal figures. Returned with the assumptions written down.",
    deliverable: "A calculation sheet with the assumptions written down",
    turnaround: "3 days",
  },
  {
    title: "On-site inspection",
    stage: "While the wall is going up",
    sketch: "inspection",
    lead: "Someone who has seen it go wrong, on the scaffold while it is going up.",
    body: "Fixing patterns, mesh laps, bead lines and movement joints, checked against the system approval before the render goes on. Findings are photographed and written up against the same layer numbers the specification used.",
    deliverable: "A photographed report against the specified layer numbers",
    turnaround: "Same week",
  },
  {
    title: "CPD training",
    stage: "Whenever the office asks",
    sketch: "training",
    lead: "An hour on why a system is approved as a whole and not layer by layer.",
    body: "Delivered in your office or online: the Construction Products Regulation, what a Declaration of Performance carries, Euroclass, and how a substitution that looks equivalent on a datasheet stops being equivalent in a system.",
    deliverable: "One certified hour, in your office or online",
    turnaround: "On request",
  },
  {
    title: "Samples and mock-ups",
    stage: "Whenever it has to be seen",
    sketch: "sample",
    lead: "The build-up as an object, at full thickness.",
    body: "Boards, meshes and finish grains as physical samples, and cut sections of a complete build-up for a design team that needs to see the depth a wall is going to gain. Finishes can be matched to a colour reference.",
    deliverable: "Physical samples and cut sections of a full build-up",
    turnaround: "5 days",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* The page opens on what it is for, over a schedule of what is on it —
          the same device the catalogue's sheet list uses, because a service list
          and a sheet list are the same kind of thing. */}
      <section className="border-b rule" aria-labelledby="services-heading">
        <Container className="py-14 sm:py-18">
          <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div>
              <p className="label">Services</p>
              <h1 id="services-heading" className="display t-page mt-5 lg:whitespace-nowrap">
                Beyond the products
              </h1>
              <p className="lead mt-6 max-w-[62ch]">
                A declared value is only worth what the detail around it is worth. These five are
                what Kernbau does between the datasheet and the finished wall, in the order a job
                meets them — and each one is described by what it puts in your hands, not by how
                helpful it is.
              </p>
            </div>

            <nav aria-label="Services on this page" className="lg:pt-2">
              <p className="lane-title inline-block">Schedule</p>
              <ul className="mt-4">
                {SERVICES.map((service, i) => (
                  <li key={service.title} className="border-b rule first:border-t">
                    <a
                      href={`#service-${i + 1}`}
                      className="flex items-baseline gap-4 py-2.5 text-sm hover:text-signal"
                    >
                      <span className="mono text-xs text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">{service.title}</span>
                      <span className="mono text-xs text-muted">{service.turnaround}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </Container>
      </section>

      {/* The five, on one line.

          A section line is how a drawing says "everything here is one cut
          through one thing", and that is the claim this page makes: the five are
          stages of a single job, not five products in a rack. So the line is
          drawn as a section line — chain-dashed, with a station square at each
          stop — and the stations alternate across it, which also stops five long
          paragraphs reading as one wall of text.

          Below `lg` the line moves to the left margin and everything sits to the
          right of it: alternating needs two columns to alternate between. */}
      <Container className="py-8 sm:py-12">
        <ol className="cutline">
          {SERVICES.map((service, i) => (
            <li
              key={service.title}
              id={`service-${i + 1}`}
              data-side={i % 2 === 1 ? "right" : "left"}
              className="station scroll-mt-[calc(var(--header-h)+2rem)]"
            >
              <span aria-hidden="true" className="station-mark" />

              <Reveal className="station-body">
                <div className="flex items-baseline gap-4">
                  <span className="mono station-no">{String(i + 1).padStart(2, "0")}</span>
                  <span className="label">{service.stage}</span>
                </div>

                {/* No measure caps: the station is half the page wide and the
                    words take all of it, rather than breaking short against an
                    empty column. */}
                <h2 className="display t-sub mt-4">{service.title}</h2>
                <p className="lead mt-3">{service.lead}</p>
                <p className="mt-5 text-sm leading-relaxed">{service.body}</p>

                {/* What is issued, stated the way a title block states it. */}
                <dl className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div className="border-t-2 border-ink pt-3">
                    <dt className="label">Issued</dt>
                    <dd className="mt-1.5 text-sm">{service.deliverable}</dd>
                  </div>
                  <div className="border-t-2 border-ink pt-3">
                    <dt className="label">Turnaround</dt>
                    <dd className="mono mt-1.5 text-sm">{service.turnaround}</dd>
                  </div>
                </dl>
              </Reveal>

              {/* The drawing sits across the line from the words, which is the
                  only reason the line needs two sides. */}
              <div className="station-plate" aria-hidden="true">
                <ServiceSketch name={service.sketch} className="station-sketch" />
              </div>
            </li>
          ))}
        </ol>
      </Container>

      {/* The disclaimer is a footer line rather than a section: it is a
          footnote to the five, and setting it as a heading and a paragraph gave
          it the weight of a sixth service. */}
      <Container className="py-6">
        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3">
          <p className="mono text-xs tracking-[0.08em] text-muted uppercase">
            This information is not real
          </p>
          <Link href="/about" className="btn btn-quiet btn-sm">
            Read why
            <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </>
  );
}
