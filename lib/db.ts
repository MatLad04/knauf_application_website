// One pg Pool per process. No ORM: the queries in lib/catalogue.ts are
// hand-written SQL with numbered placeholders.

import { Pool, types } from "pg";

// pg returns numeric and bigint as strings. Every numeric here is a small
// declared value and every bigint is a COUNT, so parse them once.
types.setTypeParser(types.builtins.NUMERIC, (value) => Number.parseFloat(value));
types.setTypeParser(types.builtins.INT8, (value) => Number.parseInt(value, 10));

/**
 * One address, not two.
 *
 * `localhost` resolves to both `::1` and `127.0.0.1`, so Node dials both and a
 * refused connection comes back as an `AggregateError` carrying one child error
 * per address. That shape is the difference between a readable failure and an
 * unusable one: Next's dev overlay rebuilds errors it reports with
 * `new AggregateError(error.errors, ...)`, and on the copy it is handed the
 * `errors` array is gone — so the real "the database is not running" error was
 * replaced by `object null is not iterable`, thrown again on every render until
 * it took the dev server down with it.
 *
 * Dialling the loopback address directly is one connection, so a refusal is an
 * ordinary `Error` with an ordinary code. Only `localhost` is rewritten: inside
 * compose the host is `db`, which is a real name for a real container.
 */
function oneAddress(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
      return parsed.toString();
    }
  } catch {
    /* Not a URL we can parse. pg gets it exactly as it was given. */
  }
  return url;
}

const connectionString = oneAddress(
  process.env.DATABASE_URL ?? "postgres://kernbau:kernbau@localhost:5432/kernbau",
);

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

/** What a socket says when there is no database at the other end of it. */
const OFFLINE = new Set(["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENOTFOUND", "ETIMEDOUT"]);

/**
 * Whether this is "nothing is listening" rather than "that query is wrong".
 *
 * Node dials IPv6 and IPv4 both when a host resolves to each, so a refused
 * connection does not arrive as one error: it arrives as an `AggregateError`
 * carrying one per address. The code is on the children, not on the parent, so
 * this looks at both.
 */
function offlineCode(error: unknown): string | null {
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string" && OFFLINE.has(code)) return code;

  const nested = (error as { errors?: unknown } | null)?.errors;
  if (Array.isArray(nested)) {
    for (const child of nested) {
      const found = offlineCode(child);
      if (found) return found;
    }
  }
  return null;
}

/** Where the pool is dialling, without the credentials in front of it. */
function target(): string {
  try {
    const url = new URL(connectionString);
    return `${url.hostname}:${url.port || "5432"}`;
  } catch {
    return "the configured host";
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
    const offline = offlineCode(error);

    if (process.env.NODE_ENV !== "production") {
      if (offline) {
        // One line, and not the SQL: when the database is down every query on
        // the page fails, and printing each statement buries the one fact that
        // matters under a screenful of noise that looks like a code fault.
        console.error(
          `[kernbau] no database at ${target()} (${offline}). Start it with: docker compose up -d db`,
        );
      } else {
        console.error("[kernbau] query failed\n", text, "\nvalues:", values, "\n", error);
      }
    }

    // A refusal is reported as a plain error rather than passed on as it came.
    // The pool hands back an `AggregateError`, and an `AggregateError` thrown
    // through a server component is what the dev overlay then fails to
    // serialise — it went on to throw `object null is not iterable` on every
    // render and took the dev server down with it, which is a much worse
    // message than the true one. The true one is short, so it is said plainly.
    throw new CatalogueUnavailableError(
      offline ? new Error(`No database at ${target()} (${offline})`) : error,
    );
  }
}

export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  values: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, values);
  return rows[0] ?? null;
}
