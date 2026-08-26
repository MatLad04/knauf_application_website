"use client";

import Link from "next/link";
import { Container } from "@/components/section";
import { useEffect } from "react";

/**
 * Next redacts server error messages before they reach the client, so this
 * cannot report the specific cause, only the digest that ties it to the
 * server log. The copy names the likely cause instead of guessing at it.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-24">
      <h1 className="display max-w-3xl text-[clamp(2rem,4.5vw,3.25rem)]">
        This page could not be rendered
      </h1>
      <p className="mt-5 max-w-[58ch] text-muted">
        Reloading clears a transient failure. If it does not, the product database is probably not
        reachable. Check that the <span className="mono">db</span> service is healthy with{" "}
        <span className="mono">docker compose ps</span>. The full cause is in the server log under
        the reference below.
      </p>
      {error.digest && <p className="label mt-3">Reference {error.digest}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/products" className="btn btn-quiet">
          Search
        </Link>
        <Link href="/" className="btn btn-quiet">
          Home
        </Link>
      </div>
    </Container>
  );
}
