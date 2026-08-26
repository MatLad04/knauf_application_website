import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/catalogue";
import { SITE_URL as BASE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, applications } = await getAllSlugs();

  return [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/products`, priority: 0.9 },
    { url: `${BASE}/applications`, priority: 0.8 },
    { url: `${BASE}/about`, priority: 0.3 },
    // Product pages are the pages search traffic lands on directly.
    ...products.map((slug) => ({ url: `${BASE}/products/${slug}`, priority: 0.7 })),
    ...applications.map((slug) => ({ url: `${BASE}/applications/${slug}`, priority: 0.6 })),
  ];
}
