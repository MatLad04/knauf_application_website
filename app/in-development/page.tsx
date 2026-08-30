import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/section";

export const metadata: Metadata = {
  title: "In development",
  description:
    "Accounts, favourites and the basket are outside the scope of this prototype. What this catalogue does is choosing and justifying a product, not buying one.",
  alternates: { canonical: "/in-development" },
  robots: { index: false, follow: true },
};

/**
 * Where the account, the favourites and the basket go.
 *
 * A drawing that is not finished is not hidden, it is stamped: issued for
 * comment, not for construction, with a revision table saying what is still
 * open. That is exactly what this page is, so it says it in the same language
 * the rest of the site is drawn in rather than apologising in a grey box.
 */
const FEATURES: Record<string, { name: string; rev: string; why: string }> = {
  account: {
    name: "Account",
    rev: "A",
    why: "An account would hold saved specifications, project folders and a history of what was declared when. It needs a user table, a session and somewhere for that history to live, none of which this prototype has.",
  },
  favourites: {
    name: "Favourites",
    rev: "B",
    why: "Favourites would be a shortlist that survives leaving the site. The comparison tray already does the short-term version of this, and it lives in the URL — which is why it works with no account at all.",
  },
  basket: {
    name: "Basket",
    rev: "C",
    why: "There is no basket because the person who chooses is not the person who buys. An architect specifies, a contractor purchases and a distributor supplies; this catalogue is built for the first of those three.",
  },
};

const REVISIONS = [
  { rev: "—", date: "2026-08", note: "Catalogue, search, filters, comparison", status: "Issued" },
  { rev: "A", date: "—", note: "Account and saved specifications", status: "In development" },
  { rev: "B", date: "—", note: "Favourites across sessions", status: "In development" },
  { rev: "C", date: "—", note: "Basket and ordering", status: "Out of scope" },
];

export default async function InDevelopmentPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  const { feature } = await searchParams;
  const current = (feature && FEATURES[feature]) || null;

  return (
    <Container className="py-12 sm:py-16">
      {/* The text starts at the page's own left margin, level with the bar
          above and the footer below, and the sheet furniture sits in the middle
          of the space left over beside it — the same placement the About sheet
          head uses, so a stamp is always found in the same part of the page. */}
      {/* Four columns, and the same four the footer is set on — same count,
          same gutter — so the sheet furniture starts on the page's own third
          column line rather than in the middle of a half. Ranged on a column
          line it agrees with the footer beneath it; centred in a half it agreed
          with nothing, and was eight pixels and a five-rem indent away from the
          only vertical on the page a reader can actually see. */}
      <div className="grid items-start gap-x-12 gap-y-12 lg:grid-cols-4">
        <div className="lg:col-span-2 lg:max-w-[40rem]">
          <p className="label">Sheet not issued</p>
          <h1 className="display t-hero mt-5 max-w-[16ch]">
            {current ? current.name : "This part"} is in development
          </h1>

          <p className="lead mt-7 text-lg sm:text-xl">
            {current
              ? current.why
              : "Some of the furniture on this site is drawn but not built. This prototype is about choosing and justifying a product, not buying one."}
          </p>

          <p className="mt-6 max-w-[62ch] text-muted">
            Out of scope for the prototype. Everything the catalogue itself does — search, filter,
            compare, and read a declared value back to the standard it is declared against — is
            built and working.
          </p>

          <div className="mt-10">
            <Link href="/products" className="btn btn-primary">
              Back to the catalogue
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* The stamp, and the revision table under it. Both are how a drawing
            office says "not yet" — and both are true here. The stamp and the
            line that references it are set as one, on the third column line —
            the same line the footer's third heading is struck on. */}
        <div className="w-full lg:col-span-2">
          <div className="flex flex-col items-start gap-7 sm:gap-8">
            <p className="label">Sheet rev {current?.rev ?? "—"} · not issued</p>
            <div className="stamp" role="img" aria-label="Not issued for construction">
              <span className="stamp-line">Not issued</span>
              <span className="stamp-line">for construction</span>
              <span className="stamp-rule" />
              <span className="stamp-meta">Kernbau · prototype · rev {current?.rev ?? "—"}</span>
            </div>
          </div>

          <table className="mt-12 w-full max-w-[30rem] text-left">
            <caption className="label pb-3 text-left">Revision history</caption>
            <thead>
              <tr className="border-y rule">
                <th scope="col" className="label py-2.5 pr-3 font-normal">
                  Rev
                </th>
                <th scope="col" className="label py-2.5 pr-3 font-normal">
                  Date
                </th>
                <th scope="col" className="label py-2.5 font-normal">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {REVISIONS.map((row) => (
                <tr key={row.note} className="border-b rule align-top">
                  <td className="mono py-3 pr-3 text-xs">{row.rev}</td>
                  <td className="mono py-3 pr-3 text-xs text-muted">{row.date}</td>
                  <td className="py-3 text-sm">
                    {row.note}
                    <span
                      className="mono mt-1 block text-[0.6875rem] text-muted"
                      data-issued={row.status === "Issued" ? "true" : undefined}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}
