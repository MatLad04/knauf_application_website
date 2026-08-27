/**
 * The geometry the cards will occupy rather than a spinner, so the grid does
 * not reflow when the data arrives.
 */
export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="product-card">
          <div className="media aspect-[4/3] animate-pulse rounded-[0.875rem]" />
          <div className="mt-5 h-4 w-2/3 animate-pulse rounded-sm bg-raised" />
          <div className="mt-2 h-3 w-20 animate-pulse rounded-sm bg-raised" />
          <div className="mt-6 flex items-end justify-between">
            <div className="h-6 w-16 animate-pulse rounded-sm bg-raised" />
            <div className="h-6 w-10 animate-pulse rounded-sm bg-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="grid gap-8" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i}>
          <div className="h-3 w-24 animate-pulse rounded-sm bg-sunken" />
          <div className="mt-4 grid gap-2.5">
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className="h-4 animate-pulse rounded-sm bg-sunken" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
