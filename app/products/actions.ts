"use server";

import {
  getFacets,
  listProducts,
  suggestRelaxations,
  getCategories,
  getApplications,
  countProducts,
  type Facets,
  type Product,
} from "@/lib/catalogue";
import { parseProductQuery, type ParamIssue, type RawSearchParams } from "@/lib/params";

export type BrowseResult = {
  products: Product[];
  total: number;
  facets: Facets;
  issues: ParamIssue[];
  relaxations: Awaited<ReturnType<typeof suggestRelaxations>>;
};

/**
 * One round trip for the whole catalogue state: the products, the counts on
 * every facet, and — when nothing matched — the filters worth relaxing.
 *
 * The catalogue page renders this once on the server, and after that the
 * browser calls it directly. That is the difference between changing a filter
 * and reloading a page: the rail, the toolbar and the results already on the
 * screen stay mounted, and only the numbers and the grid change.
 */
export async function browse(raw: RawSearchParams): Promise<BrowseResult> {
  const [categories, applications] = await Promise.all([getCategories(), getApplications()]);
  const { query, issues } = parseProductQuery(raw, {
    categories: categories.map((c) => c.slug),
    applications: applications.map((a) => a.slug),
  });

  const [page, facets, total] = await Promise.all([
    listProducts(query),
    getFacets(query),
    countProducts(query),
  ]);

  return {
    products: page.products,
    total,
    facets,
    issues,
    relaxations: total === 0 ? await suggestRelaxations(query) : [],
  };
}
