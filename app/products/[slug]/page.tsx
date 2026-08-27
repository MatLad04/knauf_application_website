import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Basket, CaretRight, Heart } from "@phosphor-icons/react/dist/ssr";
import {
  getAlternatives,
  getFamilyVariants,
  getProductBySlug,
  type ProductDetail,
} from "@/lib/catalogue";
import { texture } from "@/lib/media";
import { standardHref } from "@/lib/standards";
import { documentLabel, lambda, rValue, thermalResistance } from "@/lib/format";
import SectionDrawing, { type Layer } from "@/components/section-drawing";
import ThicknessBar from "@/components/thickness-bar";
import UValueHelper from "@/components/u-value";
import ProductCard from "@/components/product-card";
import { Container } from "@/components/section";
import { Reveal } from "@/components/motion";
import CompareButton from "@/components/compare-button";

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

  // The whole family in depth order, this product included: the control under
  // the photograph is a set of siblings, not a list of "others".
  const family = [product, ...variants].sort((a, b) => (a.thicknessMm ?? 0) - (b.thicknessMm ?? 0));
  const r = thermalResistance(product.thicknessMm, product.thermalConductivity);

  /**
   * The build-up this product belongs to, whichever end of it this product is.
   *
   * A system-forming product carries its own components. A base coat, a mesh or
   * a render does not — it is *in* somebody else's, and `usedIn` says whose. The
   * argument the section makes is the same either way and is arguably stronger
   * for a component: an adhesive on its own is not a wall, and the page for one
   * should say so with the whole order it belongs to and its own line marked.
   */
  const host = product.components.length > 0 ? product : await hostSystem(product);

  const layers: Layer[] = (host?.components ?? []).map((component) => ({
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

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,33rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,44rem)]">
          {/* Fixed ratio on a phone, where the photograph is above the values
              and has nothing to match. Beside them it stretches to the height
              of the column instead: a sample photographed at 4:3 against a
              column of declared figures left a foot of empty page under the
              image, which read as a section that had failed to load. The crop
              takes the difference, not the subject. */}
          <div className="media aspect-[4/3] lg:aspect-auto lg:min-h-[26rem]">
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

            {/* The depths sit against the figure they change rather than under
                the photograph, where they were a caption to an image that does
                not vary with them. A family is one datasheet and one declared
                conductivity; the depth is the only choice, so it belongs in the
                column that carries the values it moves.

                Each is a real product page — the URL is right and the link is
                shareable — and `scroll={false}` with the veil opt-out keep it
                feeling like a switch rather than a page load. */}
            {family.length > 1 && (
              <div className="depths-row">
                <p className="label">
                  {product.thicknessMm === null ? "Other sizes" : "Other thicknesses"}
                </p>
                <div className="depths mt-3" role="group" aria-label="Thicknesses in this family">
                  {family.map((sibling) => {
                    const here = sibling.slug === product.slug;
                    return (
                      <Link
                        key={sibling.slug}
                        href={`/products/${sibling.slug}`}
                        scroll={false}
                        data-veil="off"
                        data-active={here ? "true" : undefined}
                        aria-current={here ? "page" : undefined}
                        className="depth"
                      >
                        <span className="depth-mm">
                          {sibling.thicknessMm ?? sibling.variantLabel}
                        </span>
                        <span className="depth-r">
                          {sibling.thicknessMm === null
                            ? ""
                            : `R ${(sibling.thicknessMm / 1000 / (sibling.thermalConductivity ?? 1)).toFixed(2)}`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* This is the page a specifier lands on, so it carries the things
                you do with a product: read the declaration, put it beside
                another, keep it, price it. The first spans the row because it is
                the one this page was written for. */}
            <div className="acts mt-9">
              <a href="#technical" className="btn btn-primary acts-lead">
                Declared performance
              </a>
              <CompareButton slug={product.slug} name={product.name} compact />
              <Link href="/in-development?feature=favourites" className="btn btn-quiet btn-sm">
                <Heart size={15} weight="bold" aria-hidden="true" />
                Save
              </Link>
              <Link href="/in-development?feature=basket" className="btn btn-quiet btn-sm">
                <Basket size={15} weight="bold" aria-hidden="true" />
                Quote
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
                <Row label="Harmonised standard" value={product.standard} link />
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
            <p className="caption mt-3 max-w-[70ch]">
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
          </aside>
        </Container>
      </section>

      {/* --- What it has to be bought with ------------------------------- */}
      {host && layers.length > 0 && (
        <section aria-labelledby="system-heading" className="border-t rule bg-sunken">
          <Container className="py-16">
            <Reveal className="max-w-[62rem]">
              <p className="label">Not sold alone</p>
              <h2
                id="system-heading"
                className="display mt-4 max-w-[22ch] text-[clamp(1.625rem,3.2vw,2.5rem)]"
              >
                This {noun(product.categorySlug)} is one line of {host!.components.length + 1}
              </h2>
              <p className="mt-5 max-w-[64ch] text-lg text-muted">
                The approval covers the build-up, not the {noun(product.categorySlug)}. Ordering
                this on its own gets you a product that is compliant and a wall that is not — the
                compatibility between the layers is the thing the system approval is about.
                {host!.slug !== product.slug && (
                  <>
                    {" "}
                    Below is the{" "}
                    <Link href={`/products/${host!.slug}`} className="link">
                      {host!.familyName}
                    </Link>{" "}
                    system it is approved in.
                  </>
                )}
              </p>
            </Reveal>

            <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-16">
              <div>
                <SectionDrawing layers={layers} />
              </div>

              {/* Written as an order rather than as a diagram key: a position, a
                  layer, the product that fills it and what it is for. The line
                  you are on is marked, so it is obvious this page is one of
                  them rather than the whole of it. */}
              <div className="min-w-0">
                <ol className="bom">
                  {host!.components.map((component) => {
                    const here = component.product?.slug === product.slug;
                    return (
                      <li
                        key={component.position}
                        className="bom-row"
                        data-here={here ? "true" : undefined}
                      >
                        <span className="mono bom-n">
                          {String(component.position).padStart(2, "0")}
                        </span>
                        <span className="label bom-layer">{component.layerLabel}</span>
                        <span className="min-w-0">
                          {component.product ? (
                            here ? (
                              <span className="bom-name">
                                {component.product.name}
                                <span className="bom-here">You are here</span>
                              </span>
                            ) : (
                              <Link
                                href={`/products/${component.product.slug}`}
                                className="bom-name bom-link"
                              >
                                {component.product.name}
                              </Link>
                            )
                          ) : (
                            <span className="bom-name text-muted">By others</span>
                          )}
                          {component.note && <span className="bom-note">{component.note}</span>}
                        </span>
                        <span className="mono bom-code">{component.product?.code ?? "—"}</span>
                      </li>
                    );
                  })}
                </ol>

                <div className="bom-foot">
                  <p className="text-sm">
                    <span className="mono">{host!.components.length}</span>
                    <span className="text-muted">
                      {" "}
                      layers approved with this one. Depths and the resulting U-value depend on
                      which you pick.
                    </span>
                  </p>
                  <Link href="/configurator" className="btn btn-primary btn-sm">
                    Build the whole wall
                    <ArrowRight size={14} weight="bold" aria-hidden="true" />
                  </Link>
                </div>

                {product.usedIn.length > 0 && (
                  <div className="mt-10">
                    <h3 className="label">This product is a layer of</h3>
                    <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
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
              </div>
            </div>
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
  link,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  /** The value itself is a document reference, not a measurement. */
  link?: boolean;
}) {
  const href = link && typeof value === "string" ? standardHref(value) : null;

  if (href) {
    return (
      <tr className="border-b rule first:border-t">
        <th scope="row" className="py-3 pr-4 text-left align-top font-sans font-normal">
          {label}
        </th>
        <td className="py-3 text-right whitespace-nowrap">
          <Link href={href} className="hover:text-signal">
            {value}
          </Link>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b rule first:border-t">
      <th scope="row" className="py-3 pr-4 text-left align-top font-sans font-normal">
        {label}
      </th>
      <td className="py-3 text-right whitespace-nowrap">
        {value ?? <span className="font-sans text-muted">not declared</span>}
        {/* A characteristic's unit is often a document. Where the catalogue has
            a page for it, the reference is a link — a standard nobody can look
            up is decoration on a datasheet. */}
        {value !== null && unit && (
          <span className="text-muted">
            {" "}
            {standardHref(unit) ? (
              <Link href={standardHref(unit)!} className="hover:text-signal">
                {unit}
              </Link>
            ) : (
              unit
            )}
          </span>
        )}
      </td>
    </tr>
  );
}

/**
 * The system this product is a line of.
 *
 * `usedIn` names the build-ups a component appears in; the first is the one the
 * page shows, because a base coat approved in three systems is approved in
 * three very similar systems and listing all of them answers a question nobody
 * asked. The others are still listed under the schedule.
 */
async function hostSystem(product: ProductDetail) {
  const first = product.usedIn[0];
  if (!first) return null;
  return getProductBySlug(first.slug);
}

/** What to call the thing on this page, so the heading is not always "board". */
function noun(categorySlug: string) {
  return (
    {
      "mineral-wool": "board",
      "rigid-boards": "board",
      "wood-fibre": "board",
      reinforcement: "mesh",
      "adhesives-base-coats": "coat",
      "render-finishes": "render",
      "anchors-accessories": "fixing",
    }[categorySlug] ?? "product"
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
