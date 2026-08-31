"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import CuttingMat, { useSheet } from "./cutting-mat";

/**
 * Two different jobs, deliberately not the same surface.
 *
 * The first arrival at the front door gets the cutting mat — the bare root and
 * nothing after it; see `atTheFrontDoor`. The mat is drawn by the load: the
 * figure climbs towards — never to — ninety-odd per cent while things are still
 * arriving and runs to 100 the moment they have. Then it stops and waits. A
 * loading screen that vanishes at 87% has told you nothing, and one that takes
 * itself away the instant it finishes was never meant to be read; this one is
 * lifted by the reader, with the button that appears at the hundred.
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
/** Matches `mat-out` in the stylesheet — the slow half of the dissolve. */
const LIFT = 940;
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
 * The mat is a front door, and a front door only makes sense at the front. A
 * pasted product link, a filtered catalogue, a link into a section — each one
 * is a request for a particular thing, made by somebody who has already been
 * sent there, and answering it with a title block that has to be dismissed puts
 * a door in the middle of a corridor. Worse, the thing they were sent to read
 * is already printed underneath it.
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
  // The mat is cut to the screen, and the sheet it comes back with also says
  // whether it has room to print its own label block — which is what decides
  // whether the two things that block carries are set as type under it here.
  const sheet = useSheet();
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
    } catch {
      booted = false;
    }
    if (stillness() || booted || !atTheFrontDoor()) return;

    set("boot");
    // Anything on the page that wants to arrive *after* the mat — the counters
    // in the title block — waits on this rather than on a guessed delay.
    document.documentElement.dataset.booting = "1";

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
          // The session is marked as booted here rather than when the effect
          // starts. Claiming it up front means an effect that mounts, tears
          // down and mounts again — which is what React does in development,
          // and what any future double mount would do — finds the flag already
          // set on the second pass and never starts the run, leaving the mat
          // printed at nought. Marking it at the hundred also says the true
          // thing: the mat has been seen.
          try {
            sessionStorage.setItem(KEY, "1");
          } catch {
            /* Private browsing. The mat runs again; nothing else depends on it. */
          }
          set("done");
          return;
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [set]);

  // At a hundred the mat stops and waits: it is a sheet somebody may want to
  // read, and a screen that takes itself away after half a second is a screen
  // nobody was ever meant to look at. The only thing that lifts it is Enter.
  useEffect(() => {
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

  return (
    <div className="loader" data-phase={phase} role="presentation">
      {/* The mat is printed by the figure rather than moved under it: the same
          number the reader is watching draws the rules, strikes the guides and
          sets the label, so 100% is the moment the drawing is finished. Both
          the figure and the way in are printed into the label block by the mat
          itself, so nothing on this screen is floated over the drawing. */}
      <CuttingMat
        progress={(phase === "boot" ? percent : 100) / 100}
        sheet={sheet}
        enter={phase === "done"}
        onEnter={() => set("leaving")}
        className="loader-mat"
      />

      {/* Where the sheet has no room to print its label block, the two things
          that block carries are set over the mat instead, on their own rule and
          in the order the block has them: the way in on the left, the figure it
          is waiting on ranged right. */}
      {sheet.note === null && (
        <div className="loader-block">
          <button type="button" className="loader-enter" onClick={() => set("leaving")}>
            Enter the catalogue
          </button>

          <p className="loader-figure" aria-hidden="true">
            <span>{phase === "boot" ? percent : 100}</span>
            <span className="loader-unit">%</span>
          </p>
        </div>
      )}

      <p className="sr-only" role="status">
        {phase === "boot" ? "Loading the catalogue" : "Loaded"}
      </p>
    </div>
  );
}
