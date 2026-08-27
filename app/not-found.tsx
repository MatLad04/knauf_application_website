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
    <Container className="py-16 sm:py-24">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-20">
        <div className="lg:max-w-[38rem]">
          <p className="label">Drawing not found</p>
          <h1 className="display mt-6 max-w-[15ch] text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98]">
            That page is not in the catalogue
          </h1>

          <p className="mt-8 text-lg text-muted sm:text-xl">
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

        <div>
          <div
            className="stamp stamp-wide"
            role="img"
            aria-label="Sheet superseded or never issued"
          >
            <span className="stamp-line">Sheet not</span>
            <span className="stamp-line">on this drawing</span>
            <span className="stamp-rule" />
            <span className="stamp-meta">Kernbau · error 404 · no revision</span>
          </div>

          {/* How to repair the address by hand: a product code is not opaque. */}
          <table className="mt-10 w-full text-left">
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
