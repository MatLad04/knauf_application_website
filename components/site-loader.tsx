"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Logomark from "./logomark";

/**
 * Two different jobs, deliberately not the same surface.
 *
 * The first arrival at the front door gets the title page — the bare root and
 * nothing after it; see `atTheFrontDoor`. It is the page's own ground, the mark
 * in the middle of it breathing while the site arrives, and the figure it is
 * waiting on printed in the corner where a sheet prints its number. The figure
 * climbs towards — never to — ninety-odd per cent while things are still
 * arriving and runs to 100 the moment they have. At the hundred everything
 * stops: the mark holds still for a beat, and then the whole screen dissolves.
 * Nothing has to be pressed, and nothing is taken away mid-count — the freeze
 * is what makes an instant load still read as a finished one rather than as a
 * flash.
 *
 * A navigation gets a veil, and the veil goes up on the *click*. Driven off the
 * arrival instead — which is what a `usePathname` effect gives you — the new
 * page paints first and the transition plays over the top of it, so you see the
 * destination, then a flash, then the destination again. The order has to be
 * page, cover, page.
 *
 * Both are one CSS timeline driven by a `data-phase` attribute, so nothing here
 * animates a layout property and no animation library is carried for it.
 * Neither runs under `prefers-reduced-motion`, and the title page never runs
 * twice in a session.
 */
type Phase = "boot" | "hold" | "leaving" | "cover" | "reveal" | "off";

const KEY = "kernbau-booted";

/** The screen is never up for less than this, however fast the page arrives. */
const MIN_VISIBLE = 900;
/** The freeze at the hundred: finished, held, and only then taken away. */
const HOLD = 520;
/** Matches `title-out` in the stylesheet — the dissolve. */
const LIFT = 620;
/** Matches `veil-out`, which includes its own hold at full cover. */
const REVEAL = 520;
/**
 * If a click never becomes a navigation — a route that fails, a handler that
 * swallows it — the veil lets go rather than sitting over the page.
 */
const COVER_LIMIT = 2600;

const stillness = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Whether this load is somebody arriving at the site, or somebody arriving at a
 * page of it.
 *
 * The title page is a front door, and a front door only makes sense at the
 * front. A pasted product link, a filtered catalogue, a link into a section —
 * each one is a request for a particular thing, made by somebody who has
 * already been sent there, and answering it with a screen that has to be waited
 * out puts a door in the middle of a corridor. Worse, the thing they were sent
 * to read is already printed underneath it.
 *
 * So: the bare root, and nothing after it. A query is a question about a page
 * and a hash is a place inside one; either of them means the address is doing
 * work, and an address doing work is not the front door.
 *
 * Read off `location` rather than off `usePathname`, because the two halves
 * that matter here — the search and the hash — are not in the router's path at
 * all, and asking one object for all three is the only way they cannot
 * disagree.
 */
const atTheFrontDoor = () =>
  window.location.pathname === "/" && window.location.search === "" && window.location.hash === "";

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

  /* --- The title page ----------------------------------------------------- */

  useEffect(() => {
    let booted = true;
    try {
      booted = sessionStorage.getItem(KEY) === "1";
    } catch {
      booted = false;
    }
    if (stillness() || booted || !atTheFrontDoor()) return;

    set("boot");
    // Anything on the page that wants to arrive *after* the screen — the
    // counters in the title block — waits on this rather than on a guessed
    // delay.
    document.documentElement.dataset.booting = "1";

    const started = performance.now();
    let frame = 0;
    let fonts = false;
    let closing = 0;
    let from = 0;

    // Waiting on the fonts as well as the document is what stops the page
    // reflowing a beat after the screen has gone, which is the one flicker a
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
          // The session is marked as booted here rather than when the effect
          // starts. Claiming it up front means an effect that mounts, tears
          // down and mounts again — which is what React does in development,
          // and what any future double mount would do — finds the flag already
          // set on the second pass and never starts the run, leaving the screen
          // printed at nought. Marking it at the hundred also says the true
          // thing: the screen has been seen.
          try {
            sessionStorage.setItem(KEY, "1");
          } catch {
            /* Private browsing. It runs again; nothing else depends on it. */
          }
          set("hold");
          return;
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [set]);

  // The freeze, and then the dissolve. Two timers rather than one animation,
  // because the hold is a beat of stillness at the hundred — the mark stops
  // breathing, the figure stops counting — and a fade that began there would be
  // a fade with nothing held in front of it.
  useEffect(() => {
    if (phase === "hold") {
      const t = window.setTimeout(() => set("leaving"), HOLD);
      return () => window.clearTimeout(t);
    }
    if (phase === "leaving") {
      const t = window.setTimeout(() => {
        set("off");
        delete document.documentElement.dataset.booting;
        window.dispatchEvent(new Event("kernbau:entered"));
      }, LIFT);
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

  // Held at the hundred once the count is over, so the figure and the bar say
  // the same finished thing while the screen is standing still.
  const shown = phase === "boot" ? percent : 100;

  return (
    <div className="loader" data-phase={phase} role="presentation">
      {/* The lockup the bar carries, at the size a title page prints one: the
          mark and the name, set as one thing and breathing as one thing. */}
      <p className="loader-mark display" aria-hidden="true">
        <Logomark className="logomark loader-logomark" />
        KERNBAU
      </p>

      {/* Along the foot of the screen: the figure ranged right on the page's own
          margin, and under it the bar, run the whole width of the screen so
          that what is left to load is read as a length rather than as a
          detail. The figure is written first because it stands above the bar —
          the bar is the last thing on the sheet. */}
      <div className="loader-meter" aria-hidden="true">
        <p className="loader-figure mono">
          <span>{shown}</span>
          <span className="loader-unit">%</span>
        </p>
        <span className="loader-bar">
          <span className="loader-bar-fill" style={{ scale: `${shown / 100} 1` }} />
        </span>
      </div>

      <p className="sr-only" role="status">
        {phase === "boot" ? "Loading the catalogue" : "Loaded"}
      </p>
    </div>
  );
}
