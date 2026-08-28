import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { STANDARDS } from "@/lib/standards";
import { Container } from "@/components/section";
import { Enter, Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Declared against",
  description:
    "The five documents this catalogue declares against: the Construction Products Regulation, EN 13501-1, EN 13162, EN ISO 6946 and ETAG 004 — what each one decides, and where it shows up on a product page.",
  alternates: { canonical: "/standards" },
};

/**
 * The five references at the foot of every page, as a register.
 *
 * A drawing office keeps a register of the documents a job is drawn to, listed
 * by reference with a line on what each governs. That is exactly what this is,
 * and it is the reason the row in the footer stopped being type and became
 * links: a declared value only means something because a document says what was
 * measured and what the result is allowed to be called.
 */
export default function StandardsPage() {
  return (
    <Container className="py-14 sm:py-20">
      <Enter className="max-w-[62rem]">
        <p className="label">Declared against</p>
        <h1 className="display t-page mt-5 max-w-[19ch]">The documents behind the numbers</h1>
        <p className="lead mt-6 max-w-[62ch]">
          Every figure in this catalogue is a declared value, and a declared value is only a value
          because a document says what was measured, how, and what the result is allowed to be
          called. These are the five that decide it.
        </p>
      </Enter>

      <Reveal className="mt-14 sm:mt-16">
        <ol className="register">
          {STANDARDS.map((standard, i) => (
            <li key={standard.slug} className="register-row">
              <Link href={`/standards/${standard.slug}`} className="register-link group">
                <span className="mono register-index">{String(i + 1).padStart(2, "0")}</span>

                <span className="register-body">
                  <span className="mono register-ref">{standard.reference}</span>
                  <span className="display t-sub mt-2 block">{standard.title}</span>
                  <span className="mt-2.5 block max-w-[62ch] text-sm text-muted">
                    {standard.lead.split(". ")[0]}.
                  </span>
                </span>

                <span className="register-meta">
                  <span className="label">{standard.kind}</span>
                  <ArrowRight
                    size={16}
                    weight="bold"
                    aria-hidden="true"
                    className="register-arrow"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Reveal>

      <p className="caption mt-12 max-w-[68ch]">
        These pages are an orientation, not the documents. A standard is published by a national
        standards body and is bought from it; nothing here replaces reading the clause that applies
        to your job. The products in this catalogue are invented — the documents are not.
      </p>
    </Container>
  );
}
