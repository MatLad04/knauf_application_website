"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A figure that settles into place, digit by digit, the way a counter wheel
 * does.
 *
 * The four figures in the hero's title block are the extent of the catalogue —
 * how many products, how many categories, how many constructions — and they are
 * the first hard numbers on the site. Rolling them once, on arrival, does two
 * things: it says these are counts of something rather than decoration, and it
 * gives the sheet a beat of its own after the mat lifts.
 *
 * Each digit rolls its own column and stops a little after the one to its left,
 * so the number lands left to right rather than all at once. It runs exactly
 * once per mount, never on a re-render, and not at all for anyone who asked for
 * less motion — they get the settled figure immediately, and so does anyone
 * reading it with a screen reader, since the roll is `aria-hidden` scenery over
 * a plain value.
 */
export default function RollNumber({
  value,
  /** How long after the page settles the roll begins. */
  delay = 0,
}: {
  value: string;
  delay?: number;
}) {
  const [rolling, setRolling] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // On a first visit the mat is over the page and stays there until it is
    // dismissed, so rolling now would spend the whole animation behind it.
    // The loader says when it has gone.
    if (document.documentElement.dataset.booting) {
      const start = () => setRolling(true);
      window.addEventListener("kernbau:entered", start, { once: true });
      return () => window.removeEventListener("kernbau:entered", start);
    }

    setRolling(true);
  }, []);

  if (!rolling) return <span>{value}</span>;

  return (
    <span className="roll">
      <span className="sr-only">{value}</span>
      {value.split("").map((character, i) => {
        // Anything that is not a digit — a slash in "01/22" — has nothing to
        // roll to, so it is set once and stays put.
        if (!/\d/.test(character)) {
          return (
            <span key={i} aria-hidden="true" className="roll-fixed">
              {character}
            </span>
          );
        }

        const digit = Number(character);
        return (
          <span key={i} aria-hidden="true" className="roll-window">
            <span
              className="roll-column"
              style={
                {
                  "--digit": digit,
                  "--delay": `${delay + i * 90}ms`,
                } as React.CSSProperties
              }
            >
              {/* Two turns of the wheel and then the digit, so it arrives
                  rather than appears. */}
              {Array.from({ length: 20 }, (_, n) => (
                <span key={n} className="roll-digit">
                  {n % 10}
                </span>
              ))}
              <span className="roll-digit">{digit}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
}
