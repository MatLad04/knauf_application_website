import type { Metadata } from "next";
import { getAllProducts } from "@/lib/catalogue";
import { Container } from "@/components/section";
import CartView from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Basket",
  description:
    "The products you have scheduled, with quantities read back against each declared format as area covered.",
  robots: { index: false, follow: true },
};

/**
 * The basket lives in the browser, so this page cannot be told what is in it
 * before it renders. It hands the catalogue over whole — seventy-four products
 * is a smaller payload than the photographs on any other page — and the view
 * picks its lines out of it. No loading state, no fetch, and the rows are there
 * on the first paint after hydration.
 *
 * The heading is passed down rather than set above, because it belongs to the
 * same column as the list: the totals take the other column from the top of the
 * page, level with the title, instead of starting where the list does.
 */
export default async function CartPage() {
  const catalogue = await getAllProducts();

  // Keyed because it reaches the view as a variable inside a children array,
  // which React validates for keys even though its siblings are literals.
  const head = (
    <div key="head" className="schedule-head">
      <p className="label">Materials schedule</p>
      <h1 className="display t-page mt-5">Your basket</h1>
      <p className="lead mt-6 max-w-[52ch]">
        Quantities against declared formats. What a merchant would price, stated in the units the
        catalogue actually declares — boards, rolls and lengths, and the wall they cover.
      </p>
    </div>
  );

  return (
    <Container className="py-10 sm:py-12">
      <CartView catalogue={catalogue} head={head} />
    </Container>
  );
}
