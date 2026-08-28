"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LIMITS } from "@/lib/params";

const KEY = "kernbau-compare";

/** The selection, wherever it was made. Bad JSON is treated as no selection. */
export function readCompare(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function writeCompare(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs.slice(0, LIMITS.compare)));
  } catch {
    // A browser with storage switched off simply does not remember; the
    // catalogue's own selection is in the URL and still works.
  }
}

/**
 * Comparison is a selection, and a selection has to survive leaving the page
 * you made it on. In the catalogue it lives in the URL, which is why that view
 * can be shared — but a product page has no way of knowing what the catalogue
 * had selected, so the tray is kept in local storage as well and the two stay
 * in step. Adding a second product from a second product page now does what it
 * says instead of replacing the first.
 */
export default function CompareButton({
  slug,
  name,
  compact,
}: {
  slug: string;
  name: string;
  /** Sized and worded for a row of actions rather than standing on its own. */
  compact?: boolean;
}) {
  const [selection, setSelection] = useState<string[] | null>(null);

  useEffect(() => setSelection(readCompare()), []);

  // Rendered empty until the selection is known, so the server and the first
  // client render agree and the label does not flicker between them.
  const chosen = selection?.includes(slug) ?? false;
  const count = selection?.length ?? 0;
  const full = count >= LIMITS.compare && !chosen;

  const toggle = () => {
    const next = chosen
      ? (selection ?? []).filter((s) => s !== slug)
      : [...(selection ?? []), slug].slice(0, LIMITS.compare);
    setSelection(next);
    writeCompare(next);
  };

  // Inside the product page's action grid the wrapper would be a cell of its
  // own, so it steps out of the layout and lets the line and the link be grid
  // items in their own right.
  //
  // A line rather than a button: comparing is a thing you may do next, not one
  // of the two things this page is for, and four buttons of equal weight told
  // the reader nothing about which of them mattered.
  if (compact) {
    return (
      <div className="contents">
        <button
          type="button"
          onClick={toggle}
          disabled={full}
          data-active={chosen ? "true" : undefined}
          className="act-line disabled:opacity-55"
          aria-pressed={chosen}
        >
          {chosen ? "Selected to compare" : full ? `Compare holds ${LIMITS.compare}` : "Compare"}
          <span className="sr-only"> {name}</span>
        </button>

        {/* Ordered last rather than written last: in source it sits between the
            compare button and Save, and a full-width row there split the three
            actions across two lines the moment something was selected. It is a
            consequence of the row, so it belongs under the whole row. */}
        {count > 0 && (
          <Link
            href={`/compare?compare=${(selection ?? []).join(",")}`}
            className="link acts-note text-sm"
          >
            Compare {count} side by side
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={toggle}
        disabled={full}
        data-active={chosen ? "true" : undefined}
        className="btn btn-quiet disabled:opacity-55"
        aria-pressed={chosen}
      >
        {chosen
          ? "Selected to compare"
          : full
            ? `Compare holds ${LIMITS.compare}`
            : "Add to compare"}
        <span className="sr-only"> {name}</span>
      </button>

      {count > 0 && (
        <Link href={`/compare?compare=${(selection ?? []).join(",")}`} className="link text-sm">
          Compare {count} side by side
        </Link>
      )}
    </div>
  );
}
