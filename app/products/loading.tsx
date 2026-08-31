import { Container } from "@/components/section";
import { CardGridSkeleton, FiltersSkeleton, LoadingRegion } from "@/components/skeletons";

/**
 * What stands in for the catalogue while the first set is being read.
 *
 * Only the first one. Every filter change after that is a server action, not a
 * navigation, so it never reaches this file — the grid dims in place instead,
 * which keeps the products already on the screen readable while the next set
 * arrives. This is the cold open: a page that has to reach Postgres for the
 * products, the facet counts and the total before it can draw anything.
 *
 * It is the same three parts in the same three places — bar, rail, grid — so
 * the arrival is the cards filling in rather than the page assembling itself.
 */
export default function Loading() {
  return (
    <LoadingRegion label="Loading the catalogue">
      <div className="catalogue-bar sticky top-[calc(var(--header-h)_-_2px)] z-30 border-b rule">
        <Container className="toolbar-lines py-3">
          <div className="toolbar-row min-w-0 flex-1">
            <div className="h-4 w-28 animate-pulse rounded-sm bg-raised" aria-hidden="true" />
          </div>
          <div className="flex shrink-0 items-center gap-2" aria-hidden="true">
            <div className="h-8 w-[9.5rem] animate-pulse rounded-[var(--radius-control)] bg-raised sm:w-[13rem]" />
            <div className="h-8 w-28 animate-pulse rounded-[var(--radius-control)] bg-raised" />
          </div>
        </Container>
      </div>

      <Container className="grid gap-10 pb-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        {/* The rail is a column from `lg` up and a closed drawer below it, so
            below `lg` there is nothing here to stand in for. */}
        <aside className="hidden min-w-0 pt-6 lg:block lg:pt-7">
          <div
            className="label mb-4 h-3 w-16 animate-pulse rounded-sm bg-sunken"
            aria-hidden="true"
          />
          <FiltersSkeleton />
        </aside>

        <section className="min-w-0 pt-6 lg:pt-7">
          <CardGridSkeleton count={12} />
        </section>
      </Container>
    </LoadingRegion>
  );
}
