import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/section";

/**
 * Handles both unmatched URLs and notFound() from a product or application
 * page, so the copy has to work for a mistyped address and a withdrawn product
 * code alike.
 *
 * It uses the same language as `/in-development`: a drawing office does not put
 * up a friendly error, it stamps the sheet. Here the stamp is the one that goes
 * on a drawing that has been superseded or was never issued — which is exactly
 * what a 404 is — and the table under it is how a product code is actually
 * built, so the reader can repair the address themselves.
 */
const CODE = [
  { part: "KB", means: "Kernbau" },
  { part: "MW", means: "Material — mineral wool" },
  { part: "035", means: "Declared λD — 0.035 W/(m·K)" },
  { part: "100", means: "Thickness — 100 mm" },
];

export default function NotFound() {
  return (
    <Container className="py-12 sm:py-16">
      {/* Two halves. The text keeps the page's own left margin, and the sheet
          furniture sits in the middle of the space left over beside it — the
          same placement the About sheet head uses, so a stamp is always found
          in the same part of the page. */}
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="lg:max-w-[40rem]">
          <p className="label">Drawing not found</p>
          <h1 className="display t-page mt-5 max-w-[17ch]">That page is not in the catalogue</h1>

          <p className="lead mt-6">
            The address may be truncated, or the article may have been withdrawn. Every product in
            the catalogue is reachable from the search, and a product code carries enough in it to
            find the product again by hand.
          </p>

          <div className="mt-10">
            <Link href="/products" className="btn btn-primary">
              Search the catalogue
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="w-full lg:ps-20">
          {/* The status code itself, struck at drawing-number size with the
              line under it that says what it means. A reader who arrived here
              from a broken link recognises the three digits before they read a
              word, so the three digits are the largest thing on the sheet. */}
          <div className="stamp stamp-code" role="img" aria-label="Error 404, page not found">
            <span className="stamp-code-no">404</span>
            <span className="stamp-rule" />
            <span className="stamp-meta">Kernbau · page not found</span>
          </div>

          {/* How to repair the address by hand: a product code is not opaque. */}
          <table className="mt-12 w-full max-w-[30rem] text-left">
            <caption className="label pb-3 text-left">
              Reading a product code — <span className="mono">KB-MW-035-100</span>
            </caption>
            <tbody>
              {CODE.map((row) => (
                <tr key={row.part} className="border-b rule first:border-t align-baseline">
                  <td className="mono py-3 pr-5 text-sm">{row.part}</td>
                  <td className="py-3 text-sm text-muted">{row.means}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}
