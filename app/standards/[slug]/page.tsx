import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { STANDARDS, standardBySlug } from "@/lib/standards";
import { Container } from "@/components/section";
import { Enter, Reveal } from "@/components/motion";

export function generateStaticParams() {
  return STANDARDS.map((standard) => ({ slug: standard.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const standard = standardBySlug((await params).slug);
  if (!standard) return {};
  return {
    title: `${standard.reference} — ${standard.title}`,
    description: standard.lead,
    alternates: { canonical: `/standards/${standard.slug}` },
  };
}

/**
 * One document, set out the way a drawing office sets out a reference sheet.
 *
 * A title block at the head carrying the designation, what kind of document it
 * is and who publishes it; then what it governs, as a schedule; then the
 * argument, numbered; then — the part that makes it worth having on a catalogue
 * rather than a wiki — where it shows up in this catalogue, as links that
 * actually filter it.
 */
export default async function StandardPage({ params }: { params: Promise<{ slug: string }> }) {
  const standard = standardBySlug((await params).slug);
  if (!standard) notFound();

  const others = STANDARDS.filter((other) => other.slug !== standard.slug);

  return (
    <article>
      <Container className="py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="label flex flex-wrap items-center gap-1.5">
          <Link href="/standards" className="hover:text-signal">
            Declared against
          </Link>
          <CaretRight size={10} weight="bold" aria-hidden="true" />
          <span className="text-ink">{standard.reference}</span>
        </nav>

        <Enter className="mt-10 max-w-[64rem]">
          <p className="mono text-sm text-muted">{standard.reference}</p>
          <h1 className="display mt-4 max-w-[20ch] text-[clamp(2rem,5vw,3.75rem)]">
            {standard.title}
          </h1>
          <p className="mt-7 max-w-[64ch] text-lg text-muted sm:text-xl">{standard.lead}</p>
        </Enter>

        {/* The title block: what kind of document this is, and who issues it. */}
        <dl className="sheet-block mt-12">
          <Field term="Designation" value={standard.reference} mono />
          <Field term="Document" value={standard.kind} />
          <Field term="Published by" value={standard.publisher} />
        </dl>

        <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-20">
          <div className="min-w-0">
            {/* What it decides, as a schedule rather than a paragraph: this is
                the part a specifier scans for. */}
            <Reveal>
              <h2 className="label">What it governs</h2>
              <ul className="mt-5">
                {standard.governs.map((line, i) => (
                  <li
                    key={line}
                    className="flex items-baseline gap-5 border-b rule py-3.5 first:border-t"
                  >
                    <span className="mono text-xs text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm sm:text-base">{line}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            {standard.sections.map((section) => (
              <Reveal key={section.heading} className="mt-14">
                <h2 className="display text-[clamp(1.375rem,2.6vw,1.875rem)]">{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-5 max-w-[68ch] text-muted">
                    {paragraph}
                  </p>
                ))}
              </Reveal>
            ))}

            {standard.ladder && (
              <Reveal className="mt-16">
                <h2 className="display text-[clamp(1.375rem,2.6vw,1.875rem)]">
                  {standard.ladder.heading}
                </h2>
                <p className="mt-4 max-w-[62ch] text-muted">{standard.ladder.note}</p>

                {/* Drawn as a ladder because that is what it is: an ordered
                    scale, and the position on it is the information. */}
                <ol className="ladder mt-9">
                  {standard.ladder.steps.map((step, i) => (
                    <li key={step.code} className="ladder-step">
                      <span
                        className="ladder-bar"
                        aria-hidden="true"
                        style={{
                          inlineSize: `${100 - (i / standard.ladder!.steps.length) * 72}%`,
                        }}
                      />
                      <span className="mono ladder-code">{step.code}</span>
                      <span className="ladder-label">
                        <span className="text-sm font-medium sm:text-base">{step.label}</span>
                        <span className="caption mt-1 block">{step.note}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Reveal>
            )}
          </div>

          {/* The reason this page is on a catalogue and not in a library. */}
          <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <h2 className="label">In this catalogue</h2>
            <ul className="mt-5">
              {standard.appears.map((appearance) => (
                <li
                  key={appearance.href + appearance.label}
                  className="border-b rule first:border-t"
                >
                  <Link href={appearance.href} className="appears group block py-4">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{appearance.label}</span>
                      <ArrowRight
                        size={14}
                        weight="bold"
                        aria-hidden="true"
                        className="shrink-0 translate-y-0.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                    <span className="caption mt-1.5 block">{appearance.note}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {standard.siblings && (
              <>
                <h2 className="label mt-12">The rest of the set</h2>
                <ul className="mt-5">
                  {standard.siblings.map((sibling) => (
                    <li
                      key={sibling.reference}
                      className="flex items-baseline justify-between gap-4 border-b rule py-3 first:border-t"
                    >
                      <span className="mono text-xs">{sibling.reference}</span>
                      <span className="caption text-right">{sibling.note}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="caption mt-10">
              An orientation, not the document. A standard is published by a national standards body
              and is bought from it.
            </p>
          </aside>
        </div>
      </Container>

      {/* The register carries on: the next document is one click away. */}
      <section aria-labelledby="more-standards" className="closing mt-8">
        <Container className="py-16 sm:py-20">
          <h2 id="more-standards" className="label">
            Also declared against
          </h2>
          <ul className="mt-6 grid gap-x-8 gap-y-0 sm:grid-cols-2">
            {others.map((other) => (
              <li
                key={other.slug}
                className="border-b rule first:border-t sm:[&:nth-child(2)]:border-t"
              >
                <Link
                  href={`/standards/${other.slug}`}
                  className="group flex items-baseline justify-between gap-4 py-4"
                >
                  <span>
                    <span className="mono text-xs text-muted">{other.reference}</span>
                    <span className="mt-1 block text-sm font-medium group-hover:text-signal">
                      {other.title}
                    </span>
                  </span>
                  <ArrowRight
                    size={14}
                    weight="bold"
                    aria-hidden="true"
                    className="shrink-0 translate-y-1 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </article>
  );
}

function Field({ term, value, mono }: { term: string; value: string; mono?: boolean }) {
  return (
    <div className="title-cell">
      <dt className="label">{term}</dt>
      <dd className={`mt-1.5 ${mono ? "mono text-sm" : "text-sm"}`}>{value}</dd>
    </div>
  );
}
