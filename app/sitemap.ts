import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/catalogue";
import { STANDARDS } from "@/lib/standards";
import { SITE_URL as BASE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getAllSlugs();

  return [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/products`, priority: 0.9 },
    // `/applications` is a permanent redirect into the landing page now, so it
    // is not offered here: a sitemap that lists a 308 asks to be crawled twice.
    { url: `${BASE}/configurator`, priority: 0.8 },
    { url: `${BASE}/standards`, priority: 0.4 },
    ...STANDARDS.map((standard) => ({ url: `${BASE}/standards/${standard.slug}`, priority: 0.3 })),
    { url: `${BASE}/about`, priority: 0.3 },
    // Product pages are the pages search traffic lands on directly.
    ...products.map((slug) => ({ url: `${BASE}/products/${slug}`, priority: 0.7 })),
  ];
}
