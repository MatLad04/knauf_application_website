import Link from "next/link";
import type { Product } from "@/lib/catalogue";
import { productsHref, type ProductQuery, type SortKey } from "@/lib/params";
import { lambda } from "@/lib/format";

type Column = {
  label: string;
  /** Rendered instead of `label` where the heading contains a symbol. */
  display?: React.ReactNode;
  unit?: string;
  /** Sorting is a URL change, so headers are links, not buttons. */
  sort?: { asc: SortKey; desc?: SortKey };
  numeric?: boolean;
};

const COLUMNS: Column[] = [
  { label: "Code", sort: { asc: "code" } },
  { label: "Product" },
  {
    label: "λD",
    display: <span className="symbol">λD</span>,
    unit: "W/(m·K)",
    numeric: true,
    sort: { asc: "lambda-asc", desc: "lambda-desc" },
  },
  {
    label: "Thickness",
    unit: "mm",
    numeric: true,
    sort: { asc: "thickness-asc", desc: "thickness-desc" },
  },
  { label: "Fire", unit: "EN 13501-1", sort: { asc: "fire-asc" } },
  { label: "Density", unit: "kg/m³", numeric: true, sort: { asc: "density-desc" } },
  { label: "μ", display: <span className="symbol">μ</span>, numeric: true },
  { label: "CS(10)", unit: "kPa", numeric: true },
  { label: "Rw", unit: "dB", numeric: true },
  { label: "EPD" },
];

function ariaSort(column: Column, current: SortKey): "ascending" | "descending" | "none" {
  if (!column.sort) return "none";
  if (column.sort.asc === current) return "ascending";
  if (column.sort.desc === current) return "descending";
  return "none";
}

export default function SpecSchedule({
  products,
  query,
}: {
  products: Product[];
  query: ProductQuery;
}) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <caption className="sr-only">
          Declared performance for {products.length} products. Column headers sort the table.
        </caption>
        <thead>
          <tr className="border-b rule">
            {COLUMNS.map((column) => {
              const sorted = ariaSort(column, query.sort);
              // Clicking a sorted column flips it where the column has both directions.
              const next =
                column.sort &&
                (sorted === "ascending" && column.sort.desc ? column.sort.desc : column.sort.asc);

              return (
                <th
                  key={column.label}
                  scope="col"
                  aria-sort={sorted}
                  className={`px-3 py-2 align-bottom whitespace-nowrap ${
                    column.numeric ? "text-right" : "text-left"
                  }`}
                >
                  {next ? (
                    <Link
                      href={productsHref(query, { sort: next })}
                      className={`label hover:text-signal ${sorted !== "none" ? "text-signal" : ""}`}
                    >
                      {column.display ?? column.label}
                      {sorted === "ascending" && <span aria-hidden="true"> ↑</span>}
                      {sorted === "descending" && <span aria-hidden="true"> ↓</span>}
                    </Link>
                  ) : (
                    <span className="label">{column.display ?? column.label}</span>
                  )}
                  {column.unit && (
                    <span className="label block normal-case tracking-normal">{column.unit}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="mono">
          {products.map((product) => (
            <tr key={product.id} className="border-b rule last:border-0 hover:bg-sunken">
              <td className="px-3 py-2 whitespace-nowrap text-muted">{product.code}</td>
              <th scope="row" className="px-3 py-2 font-normal font-sans text-left min-w-56">
                <Link
                  href={`/products/${product.slug}`}
                  className="hover:text-signal hover:underline"
                >
                  {product.name}
                </Link>
              </th>
              <td className="px-3 py-2 text-right">
                {lambda(product.thermalConductivity) ?? "n/a"}
              </td>
              <td className="px-3 py-2 text-right">{product.thicknessMm ?? "n/a"}</td>
              <td className="px-3 py-2 whitespace-nowrap">{product.reactionToFire ?? "n/a"}</td>
              <td className="px-3 py-2 text-right">{product.densityKgm3 ?? "n/a"}</td>
              <td className="px-3 py-2 text-right">{product.vapourResistanceMu ?? "n/a"}</td>
              <td className="px-3 py-2 text-right">{product.compressiveStrengthKpa ?? "n/a"}</td>
              <td className="px-3 py-2 text-right">{product.acousticRwDb ?? "n/a"}</td>
              <td className="px-3 py-2">{product.epdAvailable ? "Yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
