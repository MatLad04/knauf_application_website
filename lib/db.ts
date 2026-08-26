// One pg Pool per process. No ORM: the queries in lib/catalogue.ts are
// hand-written SQL with numbered placeholders.

import { Pool, types } from "pg";

// pg returns numeric and bigint as strings. Every numeric here is a small
// declared value and every bigint is a COUNT, so parse them once.
types.setTypeParser(types.builtins.NUMERIC, (value) => Number.parseFloat(value));
types.setTypeParser(types.builtins.INT8, (value) => Number.parseInt(value, 10));

const connectionString =
  process.env.DATABASE_URL ?? "postgres://kernbau:kernbau@localhost:5432/kernbau";

// Modules survive hot reloads in development; a Pool per reload would exhaust
// Postgres connections within a minute of editing.
const globalForDb = globalThis as unknown as { kernbauPool?: Pool };

export const pool: Pool =
  globalForDb.kernbauPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.kernbauPool = pool;
}

// Tagged so error.tsx can distinguish "the database is not reachable" from a
// genuine bug and say something useful.
export class CatalogueUnavailableError extends Error {
  override readonly name = "CatalogueUnavailableError";
  constructor(cause: unknown) {
    super("The product catalogue could not be reached.");
    this.cause = cause;
  }
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  values: readonly unknown[] = [],
): Promise<T[]> {
  try {
    const result = await pool.query<T>(text, values as unknown[]);
    return result.rows;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[kernbau] query failed\n", text, "\nvalues:", values, "\n", error);
    }
    throw new CatalogueUnavailableError(error);
  }
}

export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  values: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, values);
  return rows[0] ?? null;
}
