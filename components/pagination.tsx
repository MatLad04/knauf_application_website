import Link from "next/link";
import { productsHref, type ProductQuery } from "@/lib/params";

export default function Pagination({
  query,
  page,
  pageCount,
}: {
  query: ProductQuery;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  // A short window around the current page: enough to orient, not a wall of numbers.
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => start + i);

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center gap-2">
      {page > 1 && (
        <Link
          href={productsHref(query, { page: page - 1 })}
          className="control px-3 py-1.5 text-sm"
        >
          Previous
        </Link>
      )}

      <ul className="flex items-center gap-1">
        {pages.map((n) => (
          <li key={n}>
            <Link
              href={productsHref(query, { page: n })}
              aria-current={n === page ? "page" : undefined}
              data-active={n === page ? "true" : undefined}
              className="control mono block px-3 py-1.5 text-sm"
            >
              {n}
              <span className="sr-only"> of {pageCount}</span>
            </Link>
          </li>
        ))}
      </ul>

      {page < pageCount && (
        <Link
          href={productsHref(query, { page: page + 1 })}
          className="control px-3 py-1.5 text-sm"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
