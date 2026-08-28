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
 * already requested; the observer only ever sets an attribute, so nothing here
 * loads, measures or reflows as you scroll.
 */
export default function SheetIndex({ applications }: { applications: App[] }) {
  const [active, setActive] = useState<string | null>(applications[0]?.slug ?? null);
  const [fills, setFills] = useState<number[]>(() => applications.map(() => 0));
  const nav = useRef<HTMLElement>(null);

  const deepest = Math.max(...applications.map((a) => a.buildUp.length), 1);

  useEffect(() => {
    const sheets = applications
      .map((a) => document.getElementById(`app-${a.slug}`))
      .filter((el): el is HTMLElement => el !== null);
    if (sheets.length === 0) return;

    // Which sheet is being read is a question about the middle of the screen,
    // not about the top of it: a band across the centre of the viewport, and
    // whichever sheet is crossing it is the one marked. Anything driven off the
    // top edge marks the next sheet while you are still reading this one.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id.replace(/^app-/, ""));
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    sheets.forEach((sheet) => observer.observe(sheet));
    return () => observer.disconnect();
  }, [applications]);

  /**
   * How far through each construction the reader is, as a fraction.
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
    let frame = 0;

    const measure = () => {
      frame = 0;
      const vh = window.innerHeight;
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
