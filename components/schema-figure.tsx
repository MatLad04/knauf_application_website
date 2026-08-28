/**
 * The catalogue's schema, drawn as a detail rather than diagrammed.
 *
 * Everywhere else on this site a drawing shows a wall. On the page that is
 * about how the thing was made, the honest subject is the six tables in
 * `db/schema.sql` — so they are drawn in the same hand the wall sections are
 * drawn in: hairline boxes with a ruled title bar, mono field names, and
 * leader lines carrying the cardinality the foreign keys actually declare.
 *
 * Every table, column and relationship below is in the schema. A drawing that
 * flattered the design would be the one thing this page cannot afford.
 */

type Table = {
  x: number;
  y: number;
  w: number;
  name: string;
  fields: string[];
  /** Join tables are ruled lighter: they carry no data of their own. */
  join?: boolean;
};

const H_HEAD = 17;
const H_ROW = 13;

const TABLES: Table[] = [
  { x: 8, y: 12, w: 108, name: "categories", fields: ["id", "slug", "name"] },
  {
    x: 8,
    y: 128,
    w: 108,
    name: "applications",
    fields: ["id", "slug", "build_up[]"],
  },
  {
    x: 168,
    y: 42,
    w: 132,
    name: "products",
    fields: [
      "id",
      "slug · code",
      "category_id",
      "thermal_cond.",
      "reaction_to_fire",
      "thickness_mm",
      "density · μ · CS",
      "epd_available",
    ],
  },
  {
    x: 148,
    y: 186,
    w: 124,
    name: "product_applications",
    fields: ["product_id", "application_id"],
    join: true,
  },
  {
    x: 336,
    y: 24,
    w: 120,
    name: "product_components",
    fields: ["product_id", "position", "component_id", "layer_label"],
  },
  {
    x: 336,
    y: 132,
    w: 120,
    name: "product_documents",
    fields: ["product_id", "kind", "reference"],
  },
];

const height = (t: Table) => H_HEAD + t.fields.length * H_ROW + 5;

/** A leader line between two tables, with the cardinality written on it. */
type Link = { d: string; label: string; lx: number; ly: number };

const LINKS: Link[] = [
  // categories 1 — n products
  { d: "M116 30 H142 V64 H168", label: "1 : n", lx: 122, ly: 26 },
  // applications n — n products, through the join
  { d: "M116 146 H132 V196 H148", label: "n", lx: 120, ly: 142 },
  { d: "M234 186 V150 H168", label: "n", lx: 238, ly: 182 },
  // products 1 — n components, and a component is itself a product
  { d: "M300 62 H318 V38 H336", label: "1 : n", lx: 302, ly: 58 },
  { d: "M300 96 H318 V146 H336", label: "1 : n", lx: 302, ly: 92 },
  // the self-reference: a component of a product is a product
  { d: "M396 96 V116 H318 V70 H300", label: "component_id", lx: 322, ly: 112 },
];

export default function SchemaFigure({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 470 244"
      role="img"
      aria-label="The catalogue schema: categories and applications joined to products, and products carrying their own components and documents."
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {LINKS.map((link) => (
        <g key={link.d}>
          <path d={link.d} opacity="0.5" strokeDasharray="3 2.5" />
          <text x={link.lx} y={link.ly} className="schema-note" fill="currentColor" stroke="none">
            {link.label}
          </text>
        </g>
      ))}

      {TABLES.map((table) => (
        <g key={table.name}>
          <rect
            x={table.x}
            y={table.y}
            width={table.w}
            height={height(table)}
            opacity={table.join ? 0.65 : 1}
          />
          {/* The ruled title bar a title block has, at the head of each box. */}
          <line x1={table.x} y1={table.y + H_HEAD} x2={table.x + table.w} y2={table.y + H_HEAD} />
          <text
            x={table.x + 6}
            y={table.y + 12}
            className="schema-name"
            fill="currentColor"
            stroke="none"
          >
            {table.name}
          </text>
          {table.fields.map((field, i) => (
            <text
              key={field}
              x={table.x + 6}
              y={table.y + H_HEAD + 10 + i * H_ROW}
              className="schema-field"
              fill="currentColor"
              stroke="none"
            >
              {field}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}
