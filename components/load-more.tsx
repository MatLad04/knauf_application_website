import Link from "next/link";
import { productsHref, type ProductQuery } from "@/lib/params";
import { plural } from "@/lib/format";

/**
 * The set grows instead of turning over. A specifier comparing products across
 * a page boundary loses the comparison, and a page number is a worse answer to
 * "how many are there" than a count is.
 *
 * It is a link and not a button: the URL carries how much has been asked for,
 * so the state survives a refresh and works with no JavaScript. `scroll={false}`
 * keeps the reader where they were when the next set lands under them.
 */
export default function LoadMore({
  query,
  shown,
  total,
}: {
  query: ProductQuery;
  shown: number;
  total: number;
}) {
  if (shown >= total) {
    return total > query.perPage ? (
      <p className="mt-16 text-center text-sm text-muted">
        <span className="mono">{total}</span> of <span className="mono">{total}</span>{" "}
        {plural(total, "product")}. That is all of them.
      </p>
    ) : null;
  }

  return (
    <div className="mt-16 flex flex-col items-center gap-5">
      <p aria-live="polite" className="text-sm">
        <span className="mono">{shown}</span>
        <span className="text-muted">/</span>
        <span className="mono">{total}</span>{" "}
        <span className="text-muted">{plural(total, "product")}</span>
      </p>

      <Link
        href={productsHref(query, { page: query.page + 1 })}
        scroll={false}
        className="btn btn-primary px-7 py-3.5"
      >
        Load more products
      </Link>
    </div>
  );
}
