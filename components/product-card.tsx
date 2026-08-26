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
 * The card has no frame. The photograph is the only object with a fill, and
 * the text sits directly on the page ground, so a grid of these reads as a row
 * of products rather than a row of boxes.
 *
 * Below the name, the three values a specifier actually chooses on: thermal
 * conductivity, reaction to fire, thickness.
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
      <div className="media aspect-[4/3]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="texture object-cover"
          style={textureCrop(product.slug)}
          priority={priority}
        />
      </div>

      {/* Products in a family share one photograph, so the drawn scale is what
          separates a 60 mm slab from the same slab at 160 mm, and it makes
          thickness comparable across the grid without reading a number. */}
      {product.thicknessMm !== null && (
        <div className="mt-3">
          <ThicknessBar thicknessMm={product.thicknessMm} />
        </div>
      )}

      <div className={`flex flex-1 flex-col ${product.thicknessMm === null ? "pt-4" : "pt-2"}`}>
        <h3 className="text-[0.9375rem] font-medium leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 group-hover:text-signal"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mono mt-1 mb-4 text-[0.6875rem] text-muted">{product.code}</p>

        {/* Pushed to the bottom so the three values line up across a row even
            when the names above them run to different lengths. */}
        <dl className="mt-auto grid grid-cols-3 border-t rule pt-4">
          <Spec
            term={<span className="symbol">λD</span>}
            srTerm="Thermal conductivity"
            value={lambda(product.thermalConductivity)}
          />
          <Spec term="Fire" srTerm="Reaction to fire" value={product.reactionToFire} centred />
          <Spec
            term={product.thicknessMm === null ? "Size" : "mm"}
            srTerm="Thickness"
            value={product.thicknessMm === null ? product.variantLabel : `${product.thicknessMm}`}
            alignEnd
          />
        </dl>

        {compareHref && (
          <Link
            href={compareHref}
            scroll={false}
            data-active={isCompared ? "true" : undefined}
            className="chip relative z-10 mt-4 justify-center self-start border-transparent text-xs text-muted hover:text-ink"
          >
            {isCompared ? "Selected" : "Compare"}
            <span className="sr-only"> {product.name}</span>
          </Link>
        )}
      </div>
    </article>
  );
}

function Spec({
  term,
  srTerm,
  value,
  centred,
  alignEnd,
}: {
  term: React.ReactNode;
  srTerm?: string;
  value: string | null;
  centred?: boolean;
  alignEnd?: boolean;
}) {
  const align = alignEnd ? "text-right" : centred ? "text-center" : "";
  return (
    <div className={`min-w-0 ${align}`}>
      <dt className="label truncate">
        {srTerm && <span className="sr-only">{srTerm}</span>}
        <span aria-hidden={srTerm ? "true" : undefined}>{term}</span>
      </dt>
      <dd className="mono mt-1 truncate text-[0.8125rem]">{value ?? "n/a"}</dd>
    </div>
  );
}
