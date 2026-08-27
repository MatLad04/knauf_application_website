import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
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
 */
const SERVICES = [
  {
    title: "Specification support",
    lead: "A written specification for the build-up you are detailing.",
    body: "Send a drawing or an outline and get back the layers in installation order, the products that carry the declared values you need, and the standards each is declared against. Issued as a document you can put in a tender, not as an email.",
    deliverable: "A specification document you can put in a tender",
    turnaround: "2 days",
  },
  {
    title: "U-value and condensation calculation",
    lead: "The number the build-up actually reaches, and where the dew point sits.",
    body: "Thermal transmittance to EN ISO 6946 and interstitial condensation to EN ISO 13788, calculated on the declared conductivities of the products in the system rather than on nominal figures. Returned with the assumptions written down.",
    deliverable: "A calculation sheet with the assumptions written down",
    turnaround: "3 days",
  },
  {
    title: "On-site inspection",
    lead: "Someone who has seen it go wrong, on the scaffold while it is going up.",
    body: "Fixing patterns, mesh laps, bead lines and movement joints, checked against the system approval before the render goes on. Findings are photographed and written up against the same layer numbers the specification used.",
    deliverable: "A photographed report against the specified layer numbers",
    turnaround: "Same week",
  },
  {
    title: "CPD training",
    lead: "An hour on why a system is approved as a whole and not layer by layer.",
    body: "Delivered in your office or online: the Construction Products Regulation, what a Declaration of Performance carries, Euroclass, and how a substitution that looks equivalent on a datasheet stops being equivalent in a system.",
    deliverable: "One certified hour, in your office or online",
    turnaround: "On request",
  },
  {
    title: "Samples and mock-ups",
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
          the same device the applications page uses, because a service list and
          a sheet list are the same kind of thing. */}
      <section className="border-b rule" aria-labelledby="services-heading">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div>
              <p className="label">Services</p>
              <h1
                id="services-heading"
                className="display mt-6 max-w-[15ch] text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95]"
              >
                The part that is not a product
              </h1>
              <p className="mt-8 max-w-[54ch] text-lg text-muted sm:text-xl">
                A declared value is only worth what the detail around it is worth. These five are
                what Kernbau does between the datasheet and the finished wall — and each one is
                described by what it puts in your hands, not by how helpful it is.
              </p>
            </div>

            <nav aria-label="Services on this page" className="lg:pt-3">
              <p className="lane-title inline-block">Schedule</p>
              <ul className="mt-4">
                {SERVICES.map((service, i) => (
                  <li key={service.title} className="border-b rule first:border-t">
                    <a
                      href={`#service-${i + 1}`}
                      className="flex items-baseline gap-4 py-3 text-sm hover:text-signal"
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

      {/* Each service as a sheet of its own: the number, the argument, and what
          is issued at the end of it. They are five different things, not five
          of the same thing, so they do not sit in a card grid. */}
      {SERVICES.map((service, i) => (
        <section
          key={service.title}
          id={`service-${i + 1}`}
          aria-labelledby={`service-${i + 1}-heading`}
          className="border-b rule scroll-mt-[calc(var(--header-h)+1rem)]"
        >
          <Container className="py-14 sm:py-20">
            <Reveal>
              <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[5rem_minmax(0,24rem)_minmax(0,1fr)]">
                <p className="mono text-3xl leading-none text-muted sm:text-4xl">
                  {String(i + 1).padStart(2, "0")}
                </p>

                <div>
                  <h2
                    id={`service-${i + 1}-heading`}
                    className="display text-[clamp(1.5rem,3vw,2.25rem)]"
                  >
                    {service.title}
                  </h2>
                  <p className="mt-4 text-muted">{service.lead}</p>
                </div>

                <div className="lg:pt-1.5">
                  <p className="max-w-[58ch] text-lg leading-relaxed">{service.body}</p>

                  {/* What is issued, stated the way a title block states it. */}
                  <dl className="mt-8 grid max-w-[34rem] gap-x-8 gap-y-4 sm:grid-cols-2">
                    <div className="border-t-2 border-ink pt-3">
                      <dt className="label">Issued</dt>
                      <dd className="mt-1.5 text-sm">{service.deliverable}</dd>
                    </div>
                    <div className="border-t-2 border-ink pt-3">
                      <dt className="label">Turnaround</dt>
                      <dd className="mono mt-1.5 text-sm">{service.turnaround}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      ))}

      <Container className="py-20 sm:py-28">
        <Reveal className="mx-auto max-w-[46rem] text-center">
          <h2 className="display text-[clamp(1.5rem,3vw,2.25rem)]">None of this is real</h2>
          <p className="mt-4 text-muted">
            Kernbau is a fictional manufacturer, so there is nobody to send a drawing to. The
            services are here because a catalogue without them is not what specifying a system
            actually looks like.
          </p>
          <Link href="/about" className="btn btn-quiet mt-8">
            About the company and the data
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </Reveal>
      </Container>
    </>
  );
}
