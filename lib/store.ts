"use client";

import { useSyncExternalStore } from "react";

/**
 * The two lists a visitor builds up while reading the catalogue: a shortlist of
 * products they want to keep, and a schedule of quantities they want a price
 * for.
 *
 * Both live in local storage for the same reason the comparison tray does — a
 * selection has to survive leaving the page it was made on, and this prototype
 * has no account to hang one on. What is new here is that the header has to
 * show the counts, and the header is on every page: a plain read at mount would
 * leave the two numbers stale the moment a card was clicked somewhere below it.
 * So the store publishes, every reader subscribes, and adding a board on the
 * catalogue moves the figure in the bar without a navigation.
 *
 * `storage` is listened to as well, which is the same event fired in *other*
 * tabs: two windows of the same catalogue stay in step.
 */

/** One line of the schedule: a product, and how many of it. */
export type CartLine = { slug: string; qty: number };

const CART_KEY = "kernbau-cart";
const SAVED_KEY = "kernbau-saved";

/** Fired in this tab; `storage` covers the others. */
const CHANGED = "kernbau:store";

/**
 * A quantity nobody typed on purpose. High enough for a real facade — a
 * thousand-square-metre elevation is roughly 1600 boards — and low enough that
 * a stuck key is a mistake you can see rather than one you have to scroll.
 */
export const MAX_QTY = 9999;

const EMPTY_CART: readonly CartLine[] = Object.freeze([]);
const EMPTY_SAVED: readonly string[] = Object.freeze([]);

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/** Whole boards only, at least one of them, and never more than the ceiling. */
const clamp = (qty: number) => Math.min(MAX_QTY, Math.max(1, Math.round(qty)));

function raw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // A browser with storage switched off simply does not remember.
    return null;
  }
}

function put(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Same deal the comparison tray makes: the list is lost on reload rather
    // than the control being dead.
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * `useSyncExternalStore` compares snapshots by identity, so parsing the JSON on
 * every call would hand React a new array each time and it would never stop
 * rendering. Each list keeps the string it was parsed from and only re-parses
 * when that string changes.
 */
function cache<T>(key: string, parse: (value: unknown) => T, empty: T) {
  // A sentinel no stored value can equal, so the first read always parses.
  let seen: string | null | undefined = undefined;
  let held: T = empty;

  return () => {
    const text = raw(key);
    if (text !== seen) {
      seen = text;
      try {
        held = text === null ? empty : parse(JSON.parse(text));
      } catch {
        held = empty;
      }
    }
    return held;
  };
}

const readCartSnapshot = cache<readonly CartLine[]>(
  CART_KEY,
  (value) => {
    if (!Array.isArray(value)) return EMPTY_CART;
    const lines: CartLine[] = [];
    for (const entry of value) {
      if (!entry || typeof entry !== "object") continue;
      const { slug, qty } = entry as Partial<CartLine>;
      if (typeof slug !== "string" || !slug) continue;
      if (typeof qty !== "number" || !Number.isFinite(qty)) continue;
      if (lines.some((line) => line.slug === slug)) continue;
      lines.push({ slug, qty: clamp(qty) });
    }
    return lines.length > 0 ? lines : EMPTY_CART;
  },
  EMPTY_CART,
);

const readSavedSnapshot = cache<readonly string[]>(
  SAVED_KEY,
  (value) => {
    if (!Array.isArray(value)) return EMPTY_SAVED;
    const slugs = [...new Set(value.filter((s): s is string => typeof s === "string" && !!s))];
    return slugs.length > 0 ? slugs : EMPTY_SAVED;
  },
  EMPTY_SAVED,
);

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/**
 * Rendered as empty on the server and on the first client pass, which is what
 * `getServerSnapshot` is for: the markup the server sent and the markup React
 * hydrates with agree, and the real list arrives one commit later. It is the
 * same reason the compare button renders nothing until it knows.
 */
export function useCart(): readonly CartLine[] {
  return useSyncExternalStore(subscribe, readCartSnapshot, () => EMPTY_CART);
}

export function useSaved(): readonly string[] {
  return useSyncExternalStore(subscribe, readSavedSnapshot, () => EMPTY_SAVED);
}

/**
 * Whether these lists have actually been read, as opposed to not yet known.
 *
 * Both hooks above answer "empty" twice before they can answer truthfully: once
 * on the server, which has no browser to ask, and once on the first client pass,
 * which has to match the markup the server sent. A page that treats that as an
 * empty list tells somebody with eight products in their basket that their
 * basket is empty, and then contradicts itself a frame later.
 *
 * So the two states are separated. This is `false` for exactly as long as the
 * lists are unknown and `true` from the commit after hydration onwards, which
 * is the difference between an empty state and a loading one.
 */
export function useStoreReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** Total units, not lines: what the figure on the basket in the bar counts. */
export function useCartCount(): number {
  return useCart().reduce((total, line) => total + line.qty, 0);
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export const cart = {
  /**
   * Clicking the same card twice is two of that product, not two lines of one.
   * A new product joins the end of the schedule; one already on it keeps its
   * position, because a list that reorders itself under the pointer is a list
   * you cannot count down.
   */
  add(slug: string, by = 1) {
    const lines = readCartSnapshot();
    const here = lines.find((line) => line.slug === slug);
    put(
      CART_KEY,
      here
        ? lines.map((line) => (line.slug === slug ? { slug, qty: clamp(line.qty + by) } : line))
        : [...lines, { slug, qty: clamp(by) }],
    );
  },

  /** Below one there is no line, so a step down from one takes it off. */
  setQty(slug: string, qty: number) {
    if (qty < 1) return cart.remove(slug);
    put(
      CART_KEY,
      readCartSnapshot().map((line) => (line.slug === slug ? { slug, qty: clamp(qty) } : line)),
    );
  },

  remove(slug: string) {
    put(
      CART_KEY,
      readCartSnapshot().filter((line) => line.slug !== slug),
    );
  },

  clear() {
    put(CART_KEY, []);
  },

  has(slug: string) {
    return readCartSnapshot().some((line) => line.slug === slug);
  },
};

export const saved = {
  add(slug: string) {
    const slugs = readSavedSnapshot();
    if (slugs.includes(slug)) return;
    put(SAVED_KEY, [...slugs, slug]);
  },

  remove(slug: string) {
    put(
      SAVED_KEY,
      readSavedSnapshot().filter((s) => s !== slug),
    );
  },

  /** The heart is a switch: pressing it again is how you take it back off. */
  toggle(slug: string) {
    const slugs = readSavedSnapshot();
    put(SAVED_KEY, slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug]);
  },

  clear() {
    put(SAVED_KEY, []);
  },
};
