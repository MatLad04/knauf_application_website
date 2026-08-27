import type { Metadata } from "next";
import { hasAnyFilter, parseProductQuery, type RawSearchParams } from "@/lib/params";
import CatalogueBrowser from "@/components/catalogue-browser";
import { browse } from "./actions";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { query } = parseProductQuery(await searchParams);
  return {
    title: query.q ? `“${query.q}” in the catalogue` : "Products",
    description:
      "Filter Kernbau insulation, reinforcement and render systems by declared performance: thermal conductivity, reaction to fire, thickness, application and EPD.",
    // Filtered views are the same products in a different order: one canonical page.
    alternates: { canonical: "/products" },
    robots: hasAnyFilter(query) ? { index: false, follow: true } : undefined,
  };
}

/**
 * The first set is rendered on the server, so the catalogue is a real page for
 * a crawler and for a browser with no JavaScript. Everything after that is the
 * browser calling one action: see `components/catalogue-browser.tsx`.
 */
export default async function ProductsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const initial = await browse(raw);

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
    else if (value !== undefined) search.set(key, value);
  }

  return <CatalogueBrowser initial={initial} initialSearch={search.toString()} />;
}
