"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import CuttingMat from "./cutting-mat";

/**
 * Two different jobs, deliberately not the same surface.
 *
 * The first visit gets the blue mat. It stays up for exactly as long as the
 * page needs and no less than `MIN_VISIBLE`: the figure climbs towards — never
 * to — ninety-odd per cent while things are still arriving, runs to 100 the
 * moment they have, holds there long enough to be read, and only then lifts.
 * A loading screen that vanishes at 87% has told you nothing; one that flashes
 * past on a warm cache reads as a glitch.
 *
 * A navigation gets a veil, and the veil goes up on the *click*. Driven off the
 * arrival instead — which is what a `usePathname` effect gives you — the new
 * page paints first and the transition plays over the top of it, so you see the
 * destination, then a flash, then the destination again. The order has to be
 * page, cover, page.
 *
 * Both are one CSS timeline driven by a `data-phase` attribute, so nothing here
 * animates a layout property and no animation library is carried for it.
 * Neither runs under `prefers-reduced-motion`, and the mat never runs twice in
 * a session.
 */
type Phase = "boot" | "done" | "leaving" | "cover" | "reveal" | "off";

const KEY = "kernbau-booted";

/** The mat is never up for less than this, however fast the page arrives. */
const MIN_VISIBLE = 1050;
/** How long 100% is held before the mat lifts. */
const COMPLETE_HOLD = 520;
/** Matches `mat-out` in the stylesheet. */
const LIFT = 620;
/** Matches `veil-out`, which includes its own hold at full cover. */
const REVEAL = 520;
/**
 * If a click never becomes a navigation — a route that fails, a handler that
 * swallows it — the veil lets go rather than sitting over the page.
 */
const COVER_LIMIT = 2600;

const stillness = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function SiteLoader() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("off");
  const [percent, setPercent] = useState(0);

  // The click handler is bound once and has to know the phase without being
  // rebound every time it changes.
  const current = useRef<Phase>("off");
  const set = useCallback((next: Phase) => {
    current.current = next;
    setPhase(next);
  }, []);

  /* --- The mat ----------------------------------------------------------- */

  useEffect(() => {
    let booted = true;
    try {
      booted = sessionStorage.getItem(KEY) === "1";
      sessionStorage.setItem(KEY, "1");
    } catch {
      booted = false;
    }
    if (stillness() || booted) return;

    set("boot");

    const started = performance.now();
    let frame = 0;
    let fonts = false;
    let closing = 0;
    let from = 0;

    // Waiting on the fonts as well as the document is what stops the page
    // reflowing a beat after the mat has gone, which is the one flicker a
    // loading screen is supposed to prevent.
    document.fonts?.ready.then(() => {
      fonts = true;
    });

    const tick = (now: number) => {
      const elapsed = now - started;

      if (!closing) {
        // Asymptotic: it slows as it climbs and never reaches the ceiling, so
        // the figure is always moving and never claims to be finished.
        const climb = 93 * (1 - Math.exp(-elapsed / 820));
        setPercent(Math.round(climb));

        const ready = document.readyState === "complete" && fonts;
        if (ready && elapsed >= MIN_VISIBLE) {
          closing = now;
          from = climb;
        }
      } else {
        // The run to 100 is its own short, eased move rather than a jump.
        const t = Math.min(1, (now - closing) / 300);
        const eased = 1 - Math.pow(1 - t, 3);
        setPercent(Math.round(from + (100 - from) * eased));

        if (t === 1) {
          set("done");
          return;
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [set]);

  // 100% is held, then the mat lifts, then it is gone. Split into two timers so
  // the hold is a state a reader can see rather than a number that flashes.
  useEffect(() => {
    if (phase === "done") {
      const t = window.setTimeout(() => set("leaving"), COMPLETE_HOLD);
      return () => window.clearTimeout(t);
    }
    if (phase === "leaving") {
      const t = window.setTimeout(() => set("off"), LIFT);
      return () => window.clearTimeout(t);
    }
  }, [phase, set]);

  /* --- The veil ---------------------------------------------------------- */

  // Up on the click, so it is over the old page before the new one paints.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (current.current !== "off" || stillness()) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      // Some links are a different URL but the same place: swapping one
      // thickness of a board for another is a control, not a journey, and
      // veiling it would make a switch feel like a page load.
      if (anchor.dataset.veil === "off") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.href);
      // A hash or a filter on the page you are already on is not a journey.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      set("cover");
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [set]);

  // Back and forward are journeys too, and they arrive without a click.
  useEffect(() => {
    const onPop = () => {
      if (current.current === "off" && !stillness()) set("cover");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [set]);

  // Arrival: the page underneath has changed, so the veil can come down.
  useEffect(() => {
    if (current.current !== "cover") return;
    set("reveal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (phase === "reveal") {
      const t = window.setTimeout(() => set("off"), REVEAL);
      return () => window.clearTimeout(t);
    }
    if (phase === "cover") {
      const t = window.setTimeout(() => set("off"), COVER_LIMIT);
      return () => window.clearTimeout(t);
    }
  }, [phase, set]);

  /* ----------------------------------------------------------------------- */

  if (phase === "off") return null;

  if (phase === "cover" || phase === "reveal") {
    return <div className="veil" data-phase={phase} role="presentation" />;
  }

  return (
    <div className="loader" data-phase={phase} role="presentation">
      <CuttingMat className="loader-mat" />

      <p className="loader-figure" aria-hidden="true">
        <span>{phase === "boot" ? percent : 100}</span>
        <span className="loader-unit">%</span>
      </p>

      <p className="sr-only" role="status">
        {phase === "boot" ? "Loading the catalogue" : "Loaded"}
      </p>
    </div>
  );
}
