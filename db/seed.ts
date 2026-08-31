/**
 * Loads data/catalogue.json into Postgres. Runs on every container start: the
 * schema drops and rebuilds, so the demo database is identical everywhere.
 *
 * The JSON file is the swappable part — a real PIM export would replace it
 * without changing this file.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const here = dirname(fileURLToPath(import.meta.url));

type CatalogueFile = {
  categories: {
    slug: string;
    name: string;
    summary: string;
    texture_key: string;
    sort_order: number;
  }[];
  applications: {
    slug: string;
    name: string;
    index_no: number;
    summary: string;
    description: string;
    image_key: string;
    build_up: string[];
  }[];
  products: {
    slug: string;
    code: string;
    name: string;
    family: string;
    family_name: string;
    category_slug: string;
    summary: string;
    description: string;
    standard: string;
    dop_number: string;
    ce_marked: boolean;
    thermal_conductivity: number | null;
    reaction_to_fire: string | null;
    fire_rank: number | null;
    compressive_strength_kpa: number | null;
    vapour_resistance_mu: number | null;
    density_kgm3: number | null;
    thickness_mm: number | null;
    acoustic_rw_db: number | null;
    epd_available: boolean;
    format_mm: string | null;
    consumption: string | null;
    substrates: string[];
    texture_key: string;
    variant_label: string | null;
    variant_note: string | null;
    sort_order: number;
    applications: { slug: string; is_primary: boolean }[];
    components: {
      position: number;
      layer_label: string;
      component_code: string | null;
      note: string | null;
    }[];
    documents: {
      kind: string;
      title: string;
      reference: string;
      issued_on: string;
      url: string | null;
    }[];
  }[];
};

const catalogue = JSON.parse(
  readFileSync(join(here, "..", "data", "catalogue.json"), "utf8"),
) as CatalogueFile;

const schema = readFileSync(join(here, "schema.sql"), "utf8");

/**
 * `.env`, which Next loads for the app and nothing loads for a plain script.
 *
 * This is run two ways: inside the container, where compose sets `DATABASE_URL`
 * in the environment, and on a developer's machine by `npm run db:setup`, where
 * it is in `.env` because that is where `.env.example` says to put it. Without
 * this the second case silently fell through to the default below — port 5432,
 * which on a machine that already runs Postgres is somebody else's database.
 *
 * An explicit `DATABASE_URL` still wins: `loadEnvFile` does not overwrite a
 * variable that is already set, which is what makes the container case safe.
 */
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(join(here, "..", file));
  } catch {
    // No such file, which is the normal case in the container.
  }
}

const connectionString =
  process.env.DATABASE_URL ?? "postgres://kernbau:kernbau@localhost:5432/kernbau";

/**
 * Everything search has to match, flattened at seed time. Search reaches across
 * category and application names, and joining three tables for every trigram
 * match would be the wrong shape.
 */
function searchBlob(
  product: CatalogueFile["products"][number],
  categoryName: string,
  applicationNames: string[],
): string {
  return [
    product.name,
    product.code,
    product.family_name,
    product.variant_label,
    categoryName,
    ...applicationNames,
    ...product.substrates,
    product.standard,
    product.reaction_to_fire,
    product.summary,
  ]
    .filter(Boolean)
    .join(" · ");
}

async function main() {
  const pool = new Pool({ connectionString, max: 4 });
  const client = await pool.connect();

  try {
    console.log("[seed] applying schema");
    await client.query(schema);

    await client.query("BEGIN");

    const categoryIds = new Map<string, number>();
    for (const category of catalogue.categories) {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO categories (slug, name, summary, texture_key, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [category.slug, category.name, category.summary, category.texture_key, category.sort_order],
      );
      categoryIds.set(category.slug, rows[0]!.id);
    }

    const applicationIds = new Map<string, number>();
    const applicationNames = new Map<string, string>();
    for (const application of catalogue.applications) {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO applications (slug, name, index_no, summary, description, image_key, build_up)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          application.slug,
          application.name,
          application.index_no,
          application.summary,
          application.description,
          application.image_key,
          application.build_up,
        ],
      );
      applicationIds.set(application.slug, rows[0]!.id);
      applicationNames.set(application.slug, application.name);
    }

    const productIds = new Map<string, number>(); // code → id

    for (const product of catalogue.products) {
      const categoryId = categoryIds.get(product.category_slug);
      if (categoryId === undefined) {
        throw new Error(`${product.code}: unknown category ${product.category_slug}`);
      }
      const categoryName =
        catalogue.categories.find((c) => c.slug === product.category_slug)?.name ?? "";
      const appNames = product.applications.map((a) => applicationNames.get(a.slug) ?? a.slug);

      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO products (
           slug, code, name, family, family_name, category_id, summary, description,
           standard, dop_number, ce_marked,
           thermal_conductivity, reaction_to_fire, fire_rank, compressive_strength_kpa,
           vapour_resistance_mu, density_kgm3, thickness_mm, acoustic_rw_db, epd_available,
           format_mm, variant_label, variant_note, texture_key,
           consumption, substrates, search_blob, sort_order
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11,
           $12, $13, $14, $15,
           $16, $17, $18, $19, $20,
           $21, $22, $23, $24,
           $25, $26, $27, $28
         )
         RETURNING id`,
        [
          product.slug,
          product.code,
          product.name,
          product.family,
          product.family_name,
          categoryId,
          product.summary,
          product.description,
          product.standard,
          product.dop_number,
          product.ce_marked,
          product.thermal_conductivity,
          product.reaction_to_fire,
          product.fire_rank,
          product.compressive_strength_kpa,
          product.vapour_resistance_mu,
          product.density_kgm3,
          product.thickness_mm,
          product.acoustic_rw_db,
          product.epd_available,
          product.format_mm,
          product.variant_label,
          product.variant_note,
          product.texture_key,
          product.consumption,
          product.substrates,
          searchBlob(product, categoryName, appNames),
          product.sort_order,
        ],
      );
      productIds.set(product.code, rows[0]!.id);
    }

    for (const product of catalogue.products) {
      const productId = productIds.get(product.code)!;

      for (const application of product.applications) {
        await client.query(
          `INSERT INTO product_applications (product_id, application_id, is_primary)
           VALUES ($1, $2, $3)`,
          [productId, applicationIds.get(application.slug), application.is_primary],
        );
      }

      for (const component of product.components) {
        await client.query(
          `INSERT INTO product_components (product_id, position, component_id, layer_label, note)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            productId,
            component.position,
            component.component_code ? (productIds.get(component.component_code) ?? null) : null,
            component.layer_label,
            component.note,
          ],
        );
      }

      for (const document of product.documents) {
        await client.query(
          `INSERT INTO product_documents (product_id, kind, title, reference, issued_on, url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            productId,
            document.kind,
            document.title,
            document.reference,
            document.issued_on,
            document.url,
          ],
        );
      }
    }

    await client.query("COMMIT");

    const { rows: counts } = await client.query<{ products: number; components: number }>(
      `SELECT (SELECT count(*) FROM products)::int AS products,
              (SELECT count(*) FROM product_components)::int AS components`,
    );
    console.log(
      `[seed] done — ${counts[0]!.products} products, ${counts[0]!.components} system layers`,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[seed] failed:", error);
  process.exit(1);
});
