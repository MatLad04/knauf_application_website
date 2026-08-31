import type { Metadata } from "next";
import { getAllProducts } from "@/lib/catalogue";
import { Container } from "@/components/section";
import FavouritesView from "@/components/favourites-view";

export const metadata: Metadata = {
  title: "Favourites",
  description: "The products you have kept, with the spread of declared values across them.",
  robots: { index: false, follow: true },
};

/** Same arrangement as the basket, and for the same reason. */
export default async function FavouritesPage() {
  const catalogue = await getAllProducts();

  // Keyed because it reaches the view as a variable inside a children array,
  // which React validates for keys even though its siblings are literals.
  const head = (
    <div key="head" className="schedule-head">
      <p className="label">Shortlist</p>
      <h1 className="display t-page mt-5">Your favourites</h1>
      <p className="lead mt-6 max-w-[52ch]">
        The products you have kept, and how far apart they are. A shortlist is only useful if you
        can see the spread of it, so the declared values are read across the list rather than one
        card at a time.
      </p>
    </div>
  );

  return (
    <Container className="py-10 sm:py-12">
      <FavouritesView catalogue={catalogue} head={head} />
    </Container>
  );
}
