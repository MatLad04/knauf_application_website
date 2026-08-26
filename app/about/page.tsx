import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/section";

export const metadata: Metadata = {
  title: "About the data",
  description:
    "Kernbau is a fictional manufacturer. What the catalogue data is, how it was built, and what it cannot be used for.",
  alternates: { canonical: "/about" },
};

const SOURCES = [
  {
    reference: "Regulation (EU) No 305/2011",
    note: "The Construction Products Regulation: what CE marking and a Declaration of Performance mean, and why declared values are the unit of comparison.",
  },
  {
    reference: "EN 13501-1",
    note: "Reaction to fire classification. The Euroclass system A1 to F, and the smoke and droplet sub-classes.",
  },
  {
    reference: "EN 13162, 13163, 13164, 13171",
    note: "Product standards for factory-made mineral wool, EPS, XPS and wood fibre. The set of characteristics each declares.",
  },
  {
    reference: "EN 998-1 and EN 15824",
    note: "Rendering mortars and organic renders: the standards the adhesive, base coat and finish products are declared against.",
  },
  {
    reference: "ETAG 004",
    note: "The assessment route for external thermal insulation composite systems: why a system is approved as a whole rather than layer by layer.",
  },
  {
    reference: "EN ISO 6946",
    note: "Thermal resistance and transmittance calculation, behind the R and U figures on product pages.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b rule">
        <Container className="py-12 sm:py-16">
          <h1 className="display max-w-[20ch] text-[clamp(2rem,4.5vw,3.25rem)]">
            Invented products, real specification framework
          </h1>
        </Container>
      </section>

      <Container className="grid items-start gap-12 py-14 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)] lg:gap-20">
        <div className="grid gap-8 text-lg leading-relaxed">
          <p>
            Kernbau does not exist. It was invented for this prototype so that the catalogue could
            be built without using any manufacturer&rsquo;s protected content. The products, the
            names, the codes and every declared value in the database are made up.
          </p>
          <p>
            What is not made up is the framework around them. Each value follows the format, unit
            and standard a real datasheet uses: thermal conductivity as λD in W/(m·K), reaction to
            fire as a Euroclass under EN 13501-1, compressive strength as CS(10\Y) in kPa, vapour
            diffusion as a dimensionless μ. Every product carries a Declaration of Performance
            number, because under the Construction Products Regulation that document is what makes a
            declared value traceable, and traceability is the thing a specifier is really buying.
          </p>
          <p>
            The values are internally consistent: a denser slab has a lower conductivity and a
            higher compressive strength, a graphite-loaded EPS board beats a white one by roughly
            the margin it does in practice, and no product declares a characteristic its product
            standard would not require. None of it is backed by a test report.{" "}
            <strong className="font-semibold">Nothing in this catalogue is specifiable.</strong>
          </p>

          <h2 className="display mt-4 text-[clamp(1.5rem,3vw,2rem)]">Limitations</h2>
          <ul className="grid gap-3 text-base">
            <li className="border-b rule pb-3">
              One market and one language. The schema keeps text separable so translation is an
              addition rather than a rewrite, but nothing is translated.
            </li>
            <li className="border-b rule pb-3">
              No prices, stock or ordering. Those are distributor concerns; this prototype is about
              choosing and justifying a product, not buying one.
            </li>
            <li className="border-b rule pb-3">
              Documents are stubs. A real catalogue links the actual DoP, EPD and datasheet PDFs.
            </li>
            <li className="border-b rule pb-3">
              The U-value helper is indicative. A specification figure comes from a full EN ISO 6946
              calculation including fixings and thermal bridging.
            </li>
            <li>
              The photography is generated, and two images do double duty as both an application
              header and a material texture.
            </li>
          </ul>

          <h2 className="display mt-4 text-[clamp(1.5rem,3vw,2rem)]">How the data is built</h2>
          <p className="text-base">
            Products are declared as families with variants: one slab, six thicknesses, one
            datasheet, and expanded into <span className="mono text-sm">data/catalogue.json</span>,
            which is loaded into Postgres on start. The JSON is the swappable part: a real PIM
            export against the same schema would replace it without changing the application.
          </p>
        </div>

        <aside>
          <h2 className="label">Sources consulted</h2>
          <p className="mt-2 text-sm text-muted">
            Referenced for the shape of the data: the naming, units and classification systems. No
            text or values were copied from any of them.
          </p>
          <ul className="mt-6 grid gap-4">
            {SOURCES.map((source) => (
              <li key={source.reference} className="border-t rule pt-3">
                <p className="mono text-sm">{source.reference}</p>
                <p className="text-sm text-muted mt-1">{source.note}</p>
              </li>
            ))}
          </ul>
        </aside>
      </Container>

      <Container className="pb-20">
        <Link href="/products" className="btn btn-primary group">
          Open the catalogue
          <ArrowRight
            size={16}
            weight="bold"
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </Container>
    </>
  );
}
