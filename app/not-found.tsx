import Link from "next/link";
import { Container } from "@/components/section";

/**
 * Handles both unmatched URLs and notFound() from a product or application
 * page, so the copy has to work for a mistyped address and a withdrawn
 * product code alike.
 */
export default function NotFound() {
  return (
    <Container className="py-24">
      <p className="label">404</p>
      <h1 className="display mt-3 max-w-2xl text-[clamp(2rem,4.5vw,3.25rem)]">
        That page is not in the catalogue
      </h1>
      <p className="mt-5 max-w-[58ch] text-muted">
        The address may be truncated, or the article may have been withdrawn. Product codes follow
        the pattern <span className="mono">KB-MW-035-100</span>: family, declared value, size. And
        every product is reachable from the catalogue.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/products" className="btn btn-primary">
          Search the catalogue
        </Link>
        <Link href="/applications" className="btn btn-quiet">
          Browse by application
        </Link>
      </div>
    </Container>
  );
}
