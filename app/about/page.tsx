import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import SchemaFigure from "@/components/schema-figure";
import { Container } from "@/components/section";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "About",
  description:
    "Kernbau is a fictional manufacturer invented for this prototype. Who the company is meant to be, what the catalogue data is, how it was built, and what it cannot be used for.",
  alternates: { canonical: "/about" },
};

/**
 * The title block, as a drawing carries one.
 *
 * Every construction drawing is certified by a ruled block of cells in its
 * corner: what the drawing is of, at what scale, in what state, and — the field
 * that matters most — whether it may be built from. This page exists to say
 * that a catalogue of invented products may not be, so it says it the way the
 * trade says it, in the trade's own furniture.
 *
 * Nothing in these cells is flattering and nothing is invented.
 */
const TITLE_BLOCK = [
  { term: "Project", value: "Kernbau product catalogue", note: "Prototype" },
  { term: "Scope", value: "Discovery, comparison, specification", note: "74 products" },
  { term: "Data", value: "Invented against a real framework", note: "No test reports" },
  { term: "Standards", value: "Referenced, never reproduced", note: "EU · CPR 305/2011" },
  { term: "Status", value: "Not for construction", note: "Nothing is specifiable" },
];

/**
 * General notes, numbered the way a drawing numbers them: group, then note.
 *
 * A drawing does not put its caveats in prose — it lists them, numbers them, and
 * refers to them by number, because a note you cannot cite is a note nobody can
 * hold you to. The same paragraphs used to run down this page as an
 * undifferentiated column of body copy with headings floating in it; numbered,
 * they can be read in any order and pointed at individually.
 */
const NOTES = [
  {
    group: "The company",
    notes: [
      "Kernbau is a mid-sized European manufacturer of external wall insulation, reinforcement and render systems: seven product categories, seventy-four products, and five constructions it approves them in.",
      "It sells to specifiers rather than to consumers, which is why this site is organised around declared performance and build-ups instead of around photographs of finished houses.",
      "It also does not exist. It was invented for this prototype so that the catalogue could be built without using any manufacturer’s protected content. The products, the names, the codes and every declared value in the database are made up.",
    ],
  },
  {
    group: "The data",
    notes: [
      "What is not made up is the framework around them. Each value follows the format, unit and standard a real datasheet uses: thermal conductivity as λD in W/(m·K), reaction to fire as a Euroclass under EN 13501-1, compressive strength as CS(10\\Y) in kPa, vapour diffusion as a dimensionless μ.",
      "Every product carries a Declaration of Performance number, because under the Construction Products Regulation that document is what makes a declared value traceable — and traceability is the thing a specifier is really buying.",
      "The values are internally consistent: a denser slab has a lower conductivity and a higher compressive strength, a graphite-loaded EPS board beats a white one by roughly the margin it does in practice, and no product declares a characteristic its product standard would not require.",
      "None of it is backed by a test report. Nothing in this catalogue is specifiable.",
    ],
  },
  {
    group: "Limitations",
    notes: [
      "One market and one language. The schema keeps text separable so translation is an addition rather than a rewrite, but nothing is translated.",
      "No prices, stock or ordering. Those are distributor concerns; this prototype is about choosing and justifying a product, not buying one.",
      "Documents are stubs. A real catalogue links the actual DoP, EPD and datasheet PDFs.",
      "The U-value helper is indicative. A specification figure comes from a full EN ISO 6946 calculation including fixings and thermal bridging.",
      "The photography is generated, and two images do double duty as both an application header and a material texture.",
    ],
  },
];

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
      {/* The sheet head: what this is, and the stamp that says what it is not.
          The stamp is the one loud thing on the site, and it earns it — it is a
          real convention, it is struck at the angle a real one is struck at, and
          it says the single truest thing about a catalogue of invented boards. */}
      <section className="border-b rule">
        <Container className="py-12 sm:py-16">
          <p className="label">About</p>

          {/* The eyebrow, the title and the stamp all start from the same top
              edge: centred against a taller neighbour, the title floated half a
              stamp's height away from the word naming it, which read as two
              blocks rather than as one head. */}
          <div className="mt-5 grid items-start gap-x-12 gap-y-9 lg:grid-cols-2">
            <div>
              <h1 className="display t-hero max-w-[20ch]">
                Invented products, real specification framework
              </h1>

              <p className="lead mt-6 max-w-[62ch]">
                Everything in this catalogue is made up and none of it is a lie about what a real
                one looks like. The products are invented so that no manufacturer’s content had to
                be borrowed; the units, the standards and the arithmetic around them are the ones a
                European datasheet actually carries, so the interface can be judged on whether it
                helps somebody specify.
              </p>
            </div>

            <div className="flex flex-col items-start gap-6 sm:gap-8 lg:ps-20">
              <p className="label">Sheet A-01 · issued as a prototype</p>
              {/* The same stamp the unissued sheets carry, because it is the
                  same thing being said: struck, blue, not to be built from. */}
              <div className="stamp" role="img" aria-label="Not for construction">
                <span className="stamp-line">Not for</span>
                <span className="stamp-line">construction</span>
                <span className="stamp-rule" />
                <span className="stamp-meta">Kernbau · prototype · sheet A-01</span>
              </div>
            </div>
          </div>

          {/* The title block proper. Five cells, ruled with the grid's own gaps
              so no corner carries a doubled hairline. */}
          <dl className="titleblock mt-8">
            {TITLE_BLOCK.map((cell) => (
              <div key={cell.term} className="titleblock-cell">
                <dt className="label">{cell.term}</dt>
                <dd className="mt-2 text-sm">{cell.value}</dd>
                <dd className="mono mt-1 text-xs text-muted">{cell.note}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* General notes, numbered by group. */}
      <Container className="py-14 sm:py-18">
        <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <div>
            <h2 className="label">General notes</h2>

            {NOTES.map((section, g) => (
              <Reveal key={section.group} className="mt-10 first:mt-6">
                <div className="flex items-baseline gap-4 border-b-2 border-ink pb-2">
                  <span className="mono text-xs text-muted">
                    {String(g + 1).padStart(2, "0")}.00
                  </span>
                  <h3 className="display t-sub">{section.group}</h3>
                </div>

                <ol className="notes">
                  {section.notes.map((note, n) => (
                    <li key={note.slice(0, 24)} className="note">
                      <span className="mono note-no">
                        {String(g + 1).padStart(2, "0")}.{String(n + 1).padStart(2, "0")}
                      </span>
                      <p className="max-w-[72ch] text-sm leading-relaxed">{note}</p>
                    </li>
                  ))}
                </ol>
              </Reveal>
            ))}
          </div>

          {/* The right margin carries the register, the way a sheet carries its
              references beside the notes rather than inside them — and it stays
              on screen while the notes scroll past it, because a reference is
              something you look across at while reading, not after. `self-start`
              is what makes that possible: a grid item stretched to the height of
              its row has nothing to stick within. When the notes run out, the
              register leaves with them. */}
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)] lg:max-h-[calc(100svh-var(--header-h)-4rem)] lg:self-start lg:overflow-y-auto lg:pt-8">
            <Reveal>
              <h2 className="label">References</h2>
              <p className="mt-2 max-w-[52ch] text-sm text-muted">
                Consulted for the shape of the data — the naming, units and classification systems.
                No text or values were copied from any of them.
              </p>
              <ul className="mt-6">
                {SOURCES.map((source) => (
                  <li key={source.reference} className="border-b rule py-3 first:border-t">
                    <p className="mono text-sm">{source.reference}</p>
                    <p className="mt-1 max-w-[54ch] text-sm text-muted">{source.note}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </Container>

      {/* The key to the sheet. It was in the margin and it could not be read
          there: a schema is a drawing with type in it, and type in a drawing
          cannot be scaled down the way a wall section can. Given the width of
          the page it is legible, and it is the one figure on this site whose
          subject is the thing that was actually built. */}
      <section aria-labelledby="schema-heading" className="border-t rule">
        <Container className="py-14 sm:py-18">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <p className="label">Key</p>
            <p className="label">db/schema.sql · six tables</p>
          </div>

          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:gap-16">
            <div>
              <h2 id="schema-heading" className="display t-sub max-w-[18ch]">
                How the data is built
              </h2>
              <p className="lead mt-4 max-w-[46ch]">
                Products are declared as families with variants — one slab, six thicknesses, one
                datasheet — expanded into <span className="mono">data/catalogue.json</span> and
                loaded into Postgres on start.
              </p>
              <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-muted">
                The JSON is the swappable part: a real PIM export against the same schema would
                replace it without changing the application. Every filter in the catalogue is an
                indexed column on <span className="mono">products</span>, and every build-up on a
                product page is a row of <span className="mono">product_components</span>.
              </p>
            </div>

            <Reveal>
              <figure className="schema">
                <SchemaFigure className="schema-svg" />
              </figure>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-t rule">
        <Container className="py-14 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <div>
              <h2 className="display t-sub">Judge it on the interface</h2>
              <p className="lead mt-3 max-w-[58ch]">
                The data is invented so that the part worth looking at is everything built on top of
                it: the filters, the schedule, the build-ups and the configurator.
              </p>
            </div>
            <Link href="/products" className="btn btn-primary btn-sm shrink-0">
              Search the catalogue
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
