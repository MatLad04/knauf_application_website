import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalogue";
import { texture, textureCrop } from "@/lib/media";
import { lambda } from "@/lib/format";
import ThicknessBar from "./thickness-bar";

type Props = {
  product: Product;
  /** Href that adds or removes this product from the compare selection. */
  compareHref?: string;
  isCompared?: boolean;
  priority?: boolean;
  sizes?: string;
};

/**
 * No fill and no frame: the photograph is the only object on the card and the
 * rest sits directly on the page ground, so a grid of these reads as a row of
 * products rather than a row of boxes.
 *
 * Under the name, the two figures a specifier reaches for first are set large
 * and pushed to opposite corners — conductivity is the argument and thickness
 * is the cost of it, and the pair is legible without reading a label.
 */
export default function ProductCard({
  product,
  compareHref,
  isCompared,
  priority,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw",
}: Props) {
  const { src, alt } = texture(product.textureKey);

  return (
    <article className="card group relative flex h-full flex-col">
      <div className="media aspect-[4/3] rounded-[1.25rem]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="texture object-cover"
          style={textureCrop(product.slug)}
          priority={priority}
        />

        {/* The reaction-to-fire class rides on the photograph: it is the one
            characteristic that rules a product in or out outright. */}
        {product.reactionToFire && (
          <span className="card-badge">
            <span className="sr-only">Reaction to fire </span>
            {product.reactionToFire}
          </span>
        )}
      </div>

      {/* Products in a family share one photograph, so the drawn scale is what
          separates a 60 mm slab from the same slab at 160 mm, and it makes
          thickness comparable across the grid without reading a number. */}
      {product.thicknessMm !== null && (
        <div className="mt-3.5">
          <ThicknessBar thicknessMm={product.thicknessMm} />
        </div>
      )}

      <div className={`flex flex-1 flex-col ${product.thicknessMm === null ? "pt-4" : "pt-2.5"}`}>
        <h3 className="text-[0.9375rem] font-medium leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 group-hover:text-signal"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mono mt-1 text-[0.6875rem] text-muted">{product.code}</p>

        {/* Pushed to the bottom so the figures line up across a row even when
            the names above them run to different lengths. */}
        <dl className="mt-auto flex items-end justify-between gap-3 pt-6">
          <div className="min-w-0">
            <dt className="label">
              <span className="sr-only">Thermal conductivity</span>
              <span aria-hidden="true" className="symbol">
                λD
              </span>
            </dt>
            <dd className="mono mt-0.5 text-[1.375rem] leading-none">
              {lambda(product.thermalConductivity) ?? "n/a"}
            </dd>
          </div>

          <div className="min-w-0 text-right">
            <dt className="label">
              <span className="sr-only">Thickness</span>
              <span aria-hidden="true">{product.thicknessMm === null ? "Size" : "mm"}</span>
            </dt>
            <dd className="mono mt-0.5 text-[1.375rem] leading-none">
              {product.thicknessMm === null ? product.variantLabel : product.thicknessMm}
            </dd>
          </div>
        </dl>

        {compareHref && (
          <Link
            href={compareHref}
            scroll={false}
            data-active={isCompared ? "true" : undefined}
            className="chip relative z-10 mt-5 justify-center self-start border-transparent text-xs text-muted hover:text-ink"
          >
            {isCompared ? "Selected" : "Compare"}
            <span className="sr-only"> {product.name}</span>
          </Link>
        )}
      </div>
    </article>
  );
}
