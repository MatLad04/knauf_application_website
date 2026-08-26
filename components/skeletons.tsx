import { Container } from "./section";

/**
 * The geometry the cards will occupy rather than a spinner, so the grid does
 * not reflow when the data arrives.
 */
export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 2xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="media aspect-[4/3] animate-pulse" />
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <div className="h-4 w-2/3 animate-pulse rounded-sm bg-sunken" />
            <div className="h-3 w-14 animate-pulse rounded-sm bg-sunken" />
          </div>
          <div className="mt-4 h-8 border-t rule" />
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

/** Shown while the filtered query runs. Same geometry as the real thing. */
export function CatalogueSkeleton() {
  return (
    <Container className="grid gap-10 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
      <div className="hidden lg:block">
        <FiltersSkeleton />
      </div>
      <div>
        <p role="status" className="text-sm text-muted">
          Loading products
        </p>
        <div className="mt-6">
          <CardGridSkeleton />
        </div>
      </div>
    </Container>
  );
}
