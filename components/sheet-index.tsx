"use client";

import { useEffect, useRef, useState } from "react";
import type { Application } from "@/lib/catalogue";

type App = Application & { productCount: number };

/**
 * The sheet list, as a register rather than a menu.
 *
 * A list of five names above five sections is a table of contents: you read it,
 * you scroll past it, and it never speaks again. This one stays. It is pinned
 * beside the sheets, and the line belonging to the construction you are looking
 * at is marked — so the index and the thing it indexes are the same object seen
 * from two distances, and you always know which of the five you are in.
 *
 * Two things carry the connection, and both are borrowed from the sheets
 * themselves rather than invented for the index:
 *
 * The rule on each line is drawn to the depth of that build-up — seven layers
 * is the longest line, four is the shortest — which is the same rule the layers
 * inside each sheet are drawn with. So the register is a section through the
 * whole section: five stacks at a glance, in the units the page already uses.
 *
 * The mark is the same signal the sheets light their own layers with.
 *
 * Everything it renders is server-rendered markup and every image below it is
 * already requested; the frame callback only ever sets an attribute and a
 * custom property, so nothing here loads or reflows as you scroll.
 */
export default function SheetIndex({ applications }: { applications: App[] }) {
  const [active, setActive] = useState<string | null>(applications[0]?.slug ?? null);
  const [fills, setFills] = useState<number[]>(() => applications.map(() => 0));
  const nav = useRef<HTMLElement>(null);

  const deepest = Math.max(...applications.map((a) => a.buildUp.length), 1);

  /**
   * Which construction is being read, and how far through it the reader is.
   *
   * Read off the scroll position rather than played on a trigger, which is the
   * whole difference: a triggered animation runs once, finishes, and then the
   * register is a static picture for the rest of the page. This one has no end
   * state to reach — the bars run out as you go down a sheet and back in as you
   * come up it, because the scroll position is the only thing telling them what
   * to be.
   *
   * Measured in a frame callback and never between them, so a fast scroll costs
   * one read of the layout per painted frame rather than one per scroll event.
   */
  useEffect(() => {
    const sheets = applications.map((a) => document.getElementById(`app-${a.slug}`));
    const run = document.getElementById("constructions-run");
    let frame = 0;

    const measure = () => {
      frame = 0;
      const vh = window.innerHeight;

      // The line the run hangs from: the underside of the banner once it has
      // stuck, published by the stage. On the narrow layout there is no pinned
      // line and a sheet is simply read as it passes the middle of the screen.
      const pinned = run
        ? parseFloat(getComputedStyle(run).getPropertyValue("--pin-top") || "")
        : NaN;
      const line = window.innerWidth >= 1024 && pinned > 0 ? pinned + 1 : vh / 2;

      // Which one is being read: the last sheet whose head has reached that
      // line. Measured rather than observed, because two sheets meet exactly on
      // it — one ends where the next begins — and an observer watching a band
      // across the screen answers with whichever of them crossed it last, so
      // the register marked a different construction going up than coming down.
      let mark = applications[0]?.slug ?? null;
      for (let i = 0; i < sheets.length; i += 1) {
        const sheet = sheets[i];
        if (sheet && sheet.getBoundingClientRect().top <= line) mark = applications[i]!.slug;
      }
      setActive(mark);

      setFills(
        sheets.map((sheet) => {
          if (!sheet) return 0;
          const box = sheet.getBoundingClientRect();
          // Nought when the head of the sheet is at the foot of the screen, one
          // when its foot has reached the head of it.
          const travel = box.height + vh;
          if (travel <= 0) return 0;
          return Math.min(1, Math.max(0, (vh - box.top) / travel));
        }),
      );
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [applications]);

  return (
    <nav ref={nav} aria-label="Constructions below" className="sheet-index">
      <p className="lane-title inline-block">Sheet list</p>

      <ol className="sheet-rows">
        {applications.map((application, i) => {
          const on = application.slug === active;
          return (
            <li
              key={application.slug}
              data-active={on ? "true" : undefined}
              className="sheet-row"
              style={
                {
                  "--i": i,
                  "--depth": `${Math.round((application.buildUp.length / deepest) * 100)}%`,
                  "--fill": fills[i] ?? 0,
                } as React.CSSProperties
              }
            >
              <a href={`#app-${application.slug}`} className="sheet-link">
                <span className="mono sheet-n">{String(application.indexNo).padStart(2, "0")}</span>
                <span className="sheet-name">{application.name}</span>
                {/* The depth of the build-up, drawn rather than counted, and
                    inside it how far through this one the reader has got. */}
                <span aria-hidden="true" className="sheet-depth">
                  <span className="sheet-fill" />
                </span>
                <span className="mono sheet-count">{application.buildUp.length} layers</span>
                {on && <span className="sr-only"> — currently reading</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
