"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A figure that travels to its new value instead of jumping to it.
 *
 * On a tool where four controls all move the same four numbers, a value that
 * cuts gives you no idea which way it went — you read 0.211, change the board,
 * read 0.310, and have to remember the first one to know the wall got worse.
 * A quarter-second of travel makes the direction visible without anyone having
 * to hold a number in their head.
 *
 * It is a count, not a transition: the digits are rendered, so tabular figures
 * keep the column steady and a screen reader is handed the settled value rather
 * than every frame on the way to it.
 */
export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 260,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const frame = useRef(0);

  useEffect(() => {
    if (from.current === value) return;

    // Anyone who asked for less motion gets the answer, not the journey.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }

    const start = performance.now();
    const origin = from.current;
    from.current = value;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Eased out, so it arrives rather than stops.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(origin + (value - origin) * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);

  return <span aria-hidden="true">{shown.toFixed(decimals)}</span>;
}
