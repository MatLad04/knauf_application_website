import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import {
  getAlternatives,
  getFamilyVariants,
  getProductBySlug,
  type ProductDetail,
} from "@/lib/catalogue";
import { texture } from "@/lib/media";
import { documentLabel, lambda, rValue, thermalResistance } from "@/lib/format";
import SectionDrawing, { type Layer } from "@/components/section-drawing";
import ThicknessBar from "@/components/thickness-bar";
import UValueHelper from "@/components/u-value";
import ProductCard from "@/components/product-card";
import { Container } from "@/components/section";
import { Reveal } from "@/components/motion";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: `${product.summary} Declared to ${product.standard}${
      product.thermalConductivity ? `, λD ${lambda(product.thermalConductivity)} W/(m·K)` : ""
    }${product.reactionToFire ? `, Euroclass ${product.reactionToFire}` : ""}.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, images: [texture(product.textureKey).src] },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const [variants, alternatives] = await Promise.all([
    getFamilyVariants(product),
    getAlternatives(product),
  ]);

  const { src, alt } = texture(product.textureKey);
  const r = thermalResistance(product.thicknessMm, product.thermalConductivity);

  const layers: Layer[] = product.components.map((component) => ({
    label: component.layerLabel,
    productName: component.product?.name ?? null,
    thicknessMm: component.product?.thicknessMm ?? null,
    categorySlug: categoryOf(component.product?.categoryName ?? ""),
  }));

  return (
    <article>
      {/* The photograph and the four values that decide the product, side by
          side. Everything below is the evidence for them. */}
      <Container className="py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="label flex flex-wrap items-center gap-1.5">
          <Link href="/products" className="hover:text-signal">
            Search
          </Link>
          <CaretRight size={10} weight="bold" aria-hidden="true" />
          <Link href={`/products?category=${product.categorySlug}`} className="hover:text-signal">
            {product.categoryName}
          </Link>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
          <div className="media aspect-[4/3] lg:sticky lg:top-24 lg:self-start">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="texture object-cover"
              priority
            />
          </div>

          <div className="min-w-0">
            <p className="mono text-sm text-muted">{product.code}</p>
            <h1 className="display mt-3 text-[clamp(1.875rem,4.2vw,3.25rem)]">{product.name}</h1>
            <p className="mt-5 text-lg text-muted">{product.summary}</p>

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8">
              <Headline
                term={<span className="symbol">λD</span>}
                srTerm="Thermal conductivity"
                value={lambda(product.thermalConductivity)}
                unit="W/(m·K)"
                note="EN 12667"
              />
              <Headline term="Reaction to fire" value={product.reactionToFire} note="EN 13501-1" />
              <Headline term="Thickness" value={product.thicknessMm} unit="mm" />
              <Headline
                term="R"
                srTerm="Thermal resistance"
                value={rValue(r)}
                unit="m²K/W"
                note="d divided by λD"
              />
            </dl>

            {product.thicknessMm !== null && (
              <div className="mt-8">
                <ThicknessBar thicknessMm={product.thicknessMm} />
                <p className="caption mt-1.5">Thickness to scale, against 300 mm</p>
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#technical" className="btn btn-primary">
                Declared performance
              </a>
              <Link href={`/compare?compare=${product.slug}`} className="btn btn-quiet">
                Add to compare
              </Link>
            </div>
          </div>
        </div>
      </Container>

      {/* The full declaration, with the documents and sibling thicknesses
          beside it. */}
      <section id="technical" aria-labelledby="technical-heading" className="border-t rule">
        <Container className="grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div className="min-w-0">
            <h2 id="technical-heading" className="display text-[clamp(1.625rem,3.2vw,2.5rem)]">
              Technical data
            </h2>
            <p className="mt-4 max-w-[60ch] text-muted">{product.description}</p>
            {product.variantNote && (
              <p className="mt-3 max-w-[60ch] text-muted">{product.variantNote}</p>
            )}

            <table className="mt-10 w-full border-collapse text-sm">
              <caption className="sr-only">
                Declared characteristics for {product.name}, to {product.standard}.
              </caption>
              <tbody className="mono">
                <Row label="Harmonised standard" value={product.standard} />
                <Row
                  label="Thermal conductivity λD"
                  value={lambda(product.thermalConductivity)}
                  unit="W/(m·K)"
                />
                <Row label="Reaction to fire" value={product.reactionToFire} unit="EN 13501-1" />
                <Row label="Thickness" value={product.thicknessMm} unit="mm" />
                <Row label="Density" value={product.densityKgm3} unit="kg/m³" />
                <Row
                  label="Compressive strength CS(10\Y)"
                  value={product.compressiveStrengthKpa}
                  unit="kPa"
                />
                <Row label="Vapour diffusion resistance μ" value={product.vapourResistanceMu} />
                <Row label="Weighted sound reduction Rw" value={product.acousticRwDb} unit="dB" />
                <Row label="Format" value={product.formatMm} unit="mm" />
                <Row label="Consumption" value={product.consumption} />
                <Row label="Declaration of Performance" value={product.dopNumber} />
                <Row label="CE marked" value={product.ceMarked ? "Yes" : "No"} />
                <Row label="EPD available" value={product.epdAvailable ? "Yes" : "No"} />
              </tbody>
            </table>
            <p className="caption mt-3">
              Where a row reads &ldquo;not declared&rdquo;, the characteristic is outside this
              product&rsquo;s Declaration of Performance.
            </p>
          </div>

          <aside className="grid content-start gap-8">
            {product.thermalConductivity !== null && product.thicknessMm !== null && (
              <div className="panel overflow-hidden">
                <UValueHelper
                  thicknessMm={product.thicknessMm}
                  lambda={product.thermalConductivity}
                />
              </div>
            )}

            <div>
              <h3 className="label">Documents</h3>
              <ul className="mt-3 text-sm">
                {product.documents.map((document) => (
                  <li key={document.reference} className="border-b rule py-3 first:border-t">
                    <span className="block">{documentLabel(document.kind)}</span>
                    <span className="mono text-xs text-muted">
                      {document.reference}, {document.issuedOn}
                    </span>
                    <span className="caption block">Not published in this prototype</span>
                  </li>
                ))}
              </ul>
            </div>

            {variants.length > 0 && (
              <div>
                <h3 className="label">Other thicknesses</h3>
                <ul className="mt-3 text-sm">
                  {variants.map((variant) => (
                    <li key={variant.id} className="border-b rule first:border-t">
                      <Link
                        href={`/products/${variant.slug}`}
                        className="flex justify-between gap-3 py-2.5 hover:text-signal"
                      >
                        <span>{variant.variantLabel ?? variant.name}</span>
                        <span className="mono text-xs text-muted">{variant.code}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </Container>
      </section>

      <section aria-labelledby="where-heading" className="border-t rule bg-sunken">
        <Container className="py-16">
          <Reveal>
            <h2 id="where-heading" className="display text-[clamp(1.625rem,3.2vw,2.5rem)]">
              Where it goes
            </h2>

            <div className="mt-10 grid gap-12 md:grid-cols-2">
              <div>
                <h3 className="label">Approved applications</h3>
                <ul className="mt-3">
                  {product.applications.map((application) => (
                    <li key={application.slug} className="border-b rule first:border-t">
                      <Link
                        href={`/applications/${application.slug}`}
                        className="group flex items-center justify-between gap-3 py-3.5 hover:text-signal"
                      >
                        <span className="text-lg">{application.name}</span>
                        <span className="label flex items-center gap-2">
                          {application.isPrimary ? "Primary" : "Secondary"}
                          <ArrowRight
                            size={14}
                            weight="bold"
                            aria-hidden="true"
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="label">Suitable substrates</h3>
                <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
                  {product.substrates.map((substrate) => (
                    <li key={substrate} className="border-b rule py-3 text-sm">
                      {substrate}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {layers.length > 0 && (
        <section aria-labelledby="system-heading" className="border-t rule">
          <Container className="py-16">
            <Reveal>
              <h2 id="system-heading" className="display text-[clamp(1.625rem,3.2vw,2.5rem)]">
                Sold as a system, specified as one
              </h2>
              <p className="mt-4 max-w-[60ch] text-muted">
                Compatibility is product data, not marketing. These are the layers this product is
                approved with, in installation order from the substrate outwards.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
              <SectionDrawing layers={layers} />

              <ol>
                {product.components.map((component) => (
                  <li
                    key={component.position}
                    className="grid gap-x-4 gap-y-1 border-b rule py-4 text-sm first:border-t sm:grid-cols-[3rem_10rem_minmax(0,1fr)]"
                  >
                    <span className="mono text-muted">
                      {String(component.position).padStart(2, "0")}
                    </span>
                    <span className="label">{component.layerLabel}</span>
                    <span>
                      {component.product ? (
                        <Link href={`/products/${component.product.slug}`} className="link">
                          {component.product.name}
                        </Link>
                      ) : (
                        <span className="text-muted">By others</span>
                      )}
                      {component.note && (
                        <span className="mt-0.5 block text-xs text-muted">{component.note}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {product.usedIn.length > 0 && (
              <div className="mt-14">
                <h3 className="label">This product is a layer of</h3>
                <ul className="mt-3 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
                  {product.usedIn.map((host) => (
                    <li key={host.slug} className="border-b rule py-2.5 text-sm">
                      <Link href={`/products/${host.slug}`} className="link">
                        {host.name}
                      </Link>
                      <span className="mono text-xs text-muted"> {host.code}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Container>
        </section>
      )}

      {alternatives.length > 0 && (
        <section aria-labelledby="alternatives-heading" className="border-t rule">
          <Container className="py-16">
            <Reveal>
              <h2 id="alternatives-heading" className="display text-[clamp(1.625rem,3.2vw,2.5rem)]">
                Approved for the same construction
              </h2>
              <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                {alternatives.map((alternative) => (
                  <ProductCard key={alternative.id} product={alternative} />
                ))}
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />
    </article>
  );
}

function Headline({
  term,
  srTerm,
  value,
  unit,
  note,
}: {
  term: React.ReactNode;
  srTerm?: string;
  value: string | number | null;
  unit?: string;
  note?: React.ReactNode;
}) {
  return (
    <div className="border-t-2 border-ink pt-3">
      <dt className="label">
        {srTerm && <span className="sr-only">{srTerm}</span>}
        <span aria-hidden={srTerm ? "true" : undefined}>{term}</span>
      </dt>
      <dd className="mono mt-2 text-2xl sm:text-3xl">
        {value ?? <span className="text-muted">n/a</span>}
        {value !== null && unit && <span className="text-sm text-muted"> {unit}</span>}
        {note && <span className="caption mt-1.5 block">{note}</span>}
      </dd>
    </div>
  );
}

function Row({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
}) {
  return (
    <tr className="border-b rule first:border-t">
      <th scope="row" className="py-3 pr-4 text-left align-top font-sans font-normal">
        {label}
      </th>
      <td className="py-3 text-right whitespace-nowrap">
        {value ?? <span className="font-sans text-muted">not declared</span>}
        {value !== null && unit && <span className="text-muted"> {unit}</span>}
      </td>
    </tr>
  );
}

/** The drawing keys hatch off category slugs; components carry category names. */
function categoryOf(categoryName: string): string {
  const map: Record<string, string> = {
    "Mineral wool insulation": "mineral-wool",
    "Rigid board insulation": "rigid-boards",
    "Wood fibre insulation": "wood-fibre",
    "Reinforcement meshes & profiles": "reinforcement",
    "Adhesives & base coats": "adhesives-base-coats",
    "Render finishes": "render-finishes",
    "Anchors & accessories": "anchors-accessories",
  };
  return map[categoryName] ?? "substrate";
}

function productJsonLd(product: ProductDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.code,
    description: product.summary,
    category: product.categoryName,
    brand: { "@type": "Brand", name: "Kernbau" },
    additionalProperty: [
      product.thermalConductivity !== null && {
        "@type": "PropertyValue",
        name: "Thermal conductivity",
        value: product.thermalConductivity,
        unitText: "W/(m·K)",
      },
      product.reactionToFire && {
        "@type": "PropertyValue",
        name: "Reaction to fire",
        value: product.reactionToFire,
      },
      product.thicknessMm !== null && {
        "@type": "PropertyValue",
        name: "Thickness",
        value: product.thicknessMm,
        unitText: "mm",
      },
    ].filter(Boolean),
  };
}
