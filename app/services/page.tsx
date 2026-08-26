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
    deliverable: "Specification document, 2 working days",
  },
  {
    title: "U-value and condensation calculation",
    lead: "The number the build-up actually reaches, and where the dew point sits.",
    body: "Thermal transmittance to EN ISO 6946 and interstitial condensation to EN ISO 13788, calculated on the declared conductivities of the products in the system rather than on nominal figures. Returned with the assumptions written down.",
    deliverable: "Calculation sheet with assumptions",
  },
  {
    title: "On-site inspection",
    lead: "Someone who has seen it go wrong, on the scaffold while it is going up.",
    body: "Fixing patterns, mesh laps, bead lines and movement joints, checked against the system approval before the render goes on. Findings are photographed and written up against the same layer numbers the specification used.",
    deliverable: "Inspection report, same week",
  },
  {
    title: "CPD training",
    lead: "An hour on why a system is approved as a whole and not layer by layer.",
    body: "Delivered in your office or online: the Construction Products Regulation, what a Declaration of Performance carries, Euroclass, and how a substitution that looks equivalent on a datasheet stops being equivalent in a system.",
    deliverable: "One hour, certified",
  },
  {
    title: "Samples and mock-ups",
    lead: "The build-up as an object, at full thickness.",
    body: "Boards, meshes and finish grains as physical samples, and cut sections of a complete build-up for a design team that needs to see the depth a wall is going to gain. Finishes can be matched to a colour reference.",
    deliverable: "Dispatched within 5 working days",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="border-b rule" aria-labelledby="services-heading">
        <Container className="flex min-h-[52svh] flex-col justify-end py-16 sm:py-24">
          <p className="label">Services</p>
          <h1
            id="services-heading"
            className="display mt-6 max-w-[16ch] text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95]"
          >
            The part that is not a product
          </h1>
          <p className="mt-8 max-w-[54ch] text-lg text-muted sm:text-xl">
            A declared value is only worth what the detail around it is worth. These five are what
            Kernbau does between the datasheet and the finished wall.
          </p>
        </Container>
      </section>

      {/* A numbered list rather than a grid of cards: they are five different
          things, not five of the same thing, and the numbers say so. */}
      <Container className="py-8 sm:py-14">
        <ol>
          {SERVICES.map((service, i) => (
            <li key={service.title} className="border-b rule">
              <Reveal>
                <div className="grid gap-6 py-12 sm:py-16 lg:grid-cols-[4rem_minmax(0,26rem)_minmax(0,1fr)] lg:gap-12">
                  <span className="mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>

                  <div>
                    <h2 className="display text-[clamp(1.5rem,3vw,2.25rem)]">{service.title}</h2>
                    <p className="mt-4 text-muted">{service.lead}</p>
                  </div>

                  <div className="lg:pt-2">
                    <p className="max-w-[58ch] text-lg leading-relaxed">{service.body}</p>
                    <p className="label mt-6">{service.deliverable}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>

      <Container className="pb-20 sm:pb-28">
        <Reveal className="mx-auto max-w-[46rem] text-center">
          <h2 className="display text-[clamp(1.5rem,3vw,2.25rem)]">None of this is real</h2>
          <p className="mt-4 text-muted">
            Kernbau is a fictional manufacturer, so there is nobody to send a drawing to. The
            services are here because a catalogue without them is not what specifying a system
            actually looks like.
          </p>
          <Link href="/about" className="btn btn-quiet group mt-8">
            About the company and the data
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
