/**
 * The geometry a set of results will occupy, rather than a spinner.
 *
 * A spinner says "wait"; a skeleton says "wait, and here is the shape of what
 * is coming" — so the page does not reflow when the data lands, and the reader
 * has somewhere to look while it does. Every one of these matches the real
 * component's grid and card metrics exactly; when one of those changes, the
 * skeleton beside it has to change too.
 *
 * Each is `aria-hidden`, because a grey rectangle is not information. The
 * announcement is made once, by the wrapper, as a single polite line — a screen
 * reader should hear "Loading products", not forty empty cards.
 */

/** Says what is being waited for, once, for anyone not looking at the screen. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/**
 * One card's worth of geometry: the photograph, the name, the code, and the two
 * figures pushed to opposite corners. Same metrics as `product-card.tsx`, and
 * when those change this has to change with them.
 *
 * Exported on its own because the catalogue appends these straight into its
 * live grid — see `AppendSkeleton` in `catalogue-browser.tsx` — where a wrapper
 * of its own would break the grid's columns.
 */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`product-card ${className}`} aria-hidden="true">
      <div className="media aspect-[4/3] animate-pulse rounded-[0.875rem]" />
      <div className="mt-5 h-4 w-2/3 animate-pulse rounded-sm bg-raised" />
      <div className="mt-2 h-3 w-20 animate-pulse rounded-sm bg-raised" />
      <div className="mt-6 flex items-end justify-between">
        <div className="h-6 w-16 animate-pulse rounded-sm bg-raised" />
        <div className="h-6 w-10 animate-pulse rounded-sm bg-raised" />
      </div>
    </div>
  );
}

/**
 * Cards on the same grid as `catalogue-browser`'s own — the column counts have
 * to agree at every breakpoint or the grid jumps a column when the real cards
 * arrive.
 */
export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** The four filter groups the rail opens on: application, category, fire, λD. */
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

/**
 * A row of the schedule — the basket and the shortlist are the same list with a
 * different middle column, so one skeleton covers both.
 *
 * These two pages read their lines out of local storage, which is not readable
 * until the browser has hydrated. Before that the list is not empty, it is
 * unknown, and the difference matters: showing "the basket is empty" to
 * somebody who has eight products in theirs is the page stating something
 * false, for as long as hydration takes.
 */
export function ScheduleSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="plate-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="line">
          <div className="line-product">
            <div className="media size-[4.5rem] shrink-0 animate-pulse rounded-[0.75rem]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-3/5 animate-pulse rounded-sm bg-raised" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded-sm bg-raised" />
            </div>
          </div>
          <div className="line-cell">
            <div className="h-4 w-20 animate-pulse rounded-sm bg-raised" />
          </div>
          <div className="line-cell">
            <div className="h-8 w-24 animate-pulse rounded-sm bg-raised" />
          </div>
          <div className="line-cell">
            <div className="h-8 w-8 animate-pulse rounded-sm bg-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The product sheet: the photograph on one side, the declared figures on the
 * other. Held to the same two-column split so the page does not rearrange
 * itself around the reader when the record arrives.
 */
export function ProductSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16" aria-hidden="true">
      <div className="media aspect-[4/3] animate-pulse rounded-[1rem]" />
      <div>
        <div className="h-3 w-28 animate-pulse rounded-sm bg-raised" />
        <div className="mt-5 h-10 w-4/5 animate-pulse rounded-sm bg-raised" />
        <div className="mt-3 h-10 w-3/5 animate-pulse rounded-sm bg-raised" />
        <div className="mt-8 h-4 w-full animate-pulse rounded-sm bg-raised" />
        <div className="mt-2 h-4 w-11/12 animate-pulse rounded-sm bg-raised" />
        <div className="mt-10 grid gap-px">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center justify-between py-3.5">
              <div className="h-3.5 w-36 animate-pulse rounded-sm bg-sunken" />
              <div className="h-3.5 w-20 animate-pulse rounded-sm bg-sunken" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
