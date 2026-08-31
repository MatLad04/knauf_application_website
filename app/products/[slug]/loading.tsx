import { Container } from "@/components/section";
import { LoadingRegion, ProductSkeleton } from "@/components/skeletons";

/**
 * The product sheet is four queries deep — the product, its family, its
 * alternatives and the build-up it belongs to — so it is the one page on the
 * site where a cold navigation has something to wait for. Held to the sheet's
 * own two-column split so the record lands into the shape already on screen.
 */
export default function Loading() {
  return (
    <LoadingRegion label="Loading the product">
      <Container className="py-10 sm:py-12">
        <ProductSkeleton />
      </Container>
    </LoadingRegion>
  );
}
