import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProductsBySlugs, type Product } from "@/lib/catalogue";
import { parseProductQuery, type RawSearchParams } from "@/lib/params";
import { texture, textureCrop } from "@/lib/media";
import { lambda, rValue, thermalResistance } from "@/lib/format";
import { Container } from "@/components/section";

export const metadata: Metadata = {
  title: "Compare",
  description: "Up to three Kernbau products side by side, declared value against declared value.",
  robots: { index: false, follow: true },
};

type Row = { label: string; unit?: string; value: (product: Product) => string | number | null };

const ROWS: Row[] = [
  { label: "Code", value: (p) => p.code },
  { label: "Category", value: (p) => p.categoryName },
  { label: "Standard", value: (p) => p.standard },
  {
    label: "Thermal conductivity λD",
    unit: "W/(m·K)",
    value: (p) => lambda(p.thermalConductivity),
  },
  { label: "Reaction to fire", unit: "EN 13501-1", value: (p) => p.reactionToFire },
  { label: "Thickness", unit: "mm", value: (p) => p.thicknessMm },
  {
    label: "Thermal resistance R",
    unit: "m²K/W",
    value: (p) => rValue(thermalResistance(p.thicknessMm, p.thermalConductivity)),
  },
  { label: "Density", unit: "kg/m³", value: (p) => p.densityKgm3 },
  { label: "Compressive strength", unit: "kPa", value: (p) => p.compressiveStrengthKpa },
  { label: "Vapour resistance μ", value: (p) => p.vapourResistanceMu },
  { label: "Sound reduction Rw", unit: "dB", value: (p) => p.acousticRwDb },
  { label: "EPD available", value: (p) => (p.epdAvailable ? "Yes" : "No") },
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { query, issues } = parseProductQuery(await searchParams);
  const products = await getProductsBySlugs(query.compare);

  const missing = query.compare.length - products.length;

  if (products.length === 0) {
    return (
      <Container className="py-24">
        <h1 className="display max-w-2xl text-[clamp(2rem,4.5vw,3.25rem)]">Nothing selected yet</h1>
        <p className="mt-5 max-w-[58ch] text-muted">
          Pick up to three products in the catalogue and they line up here, declared value against
          declared value.
        </p>
        <Link href="/products" className="btn btn-primary mt-8">
          Open the catalogue
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="display text-[clamp(2rem,4.5vw,3.25rem)]">
        {products.length} products side by side
      </h1>

      {(missing > 0 || issues.length > 0) && (
        <p className="panel mt-6 p-4 text-sm text-muted">
          {missing > 0 && `${missing} of the requested products is no longer in the catalogue. `}
          {issues.length > 0 && "Some parameters in the link were ignored."}
        </p>
      )}

      <div className="panel mt-10 overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[40rem]">
          <caption className="sr-only">Declared performance compared</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left p-3 align-bottom w-56">
                <span className="label">Characteristic</span>
              </th>
              {products.map((product) => {
                const image = texture(product.textureKey);
                return (
                  <th
                    key={product.id}
                    scope="col"
                    className="text-left p-3 align-bottom border-l rule"
                  >
                    <span className="media block aspect-square w-full max-w-32">
                      <Image
                        src={image.src}
                        alt=""
                        fill
                        sizes="8rem"
                        className="texture object-cover"
                        style={textureCrop(product.slug)}
                      />
                    </span>
                    <Link
                      href={`/products/${product.slug}`}
                      className="link block mt-2 font-normal"
                    >
                      {product.name}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="mono">
            {ROWS.map((row) => {
              const values = products.map((product) => row.value(product));
              // Only mark a difference when there is more than one product to differ from.
              const differs = products.length > 1 && new Set(values.map(String)).size > 1;

              return (
                <tr key={row.label} className="border-t rule">
                  <th scope="row" className="font-sans font-normal text-left p-3 align-top">
                    {row.label}
                    {row.unit && <span className="block caption">{row.unit}</span>}
                  </th>
                  {values.map((value, i) => (
                    <td
                      key={i}
                      className={`p-3 align-top border-l rule ${differs ? "text-ink" : "text-muted"}`}
                    >
                      {value ?? <span className="font-sans">not declared</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="caption mt-4">Rows where the products differ are set in full contrast.</p>

      <p className="mt-10">
        <Link href="/products" className="link">
          Back to the catalogue
        </Link>
      </p>
    </Container>
  );
}
