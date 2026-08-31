"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A control that is drawn but not built, and says so where it stands.
 *
 * Sending someone to a page to be told a button does not work costs them the
 * page they were on and gives them a navigation to undo. The honest version is
 * smaller than that: the control stays where it is, does nothing at all, and
 * the reason appears beside it.
 *
 * Three ways in, because a button has to answer however it was reached. Hover
 * shows it and taking the pointer away hides it again; focus shows it, so it is
 * reachable from the keyboard; and a press pins it open until you click
 * elsewhere or press Escape — which is the only one a touch screen has, and the
 * one someone who has just pressed a dead button is actually expecting.
 *
 * It is the drawing office's own stamp, shrunk to the size of a tag: the same
 * blue, the same slight rotation, the same legend over a rule. Nothing about it
 * is in the layout — it is positioned out of flow, so a tag appearing never
 * moves the page underneath it.
 */
export default function InDev({
  children,
  note,
  side = "top",
  block,
}: {
  /** The control itself. It keeps its own styling and does nothing. */
  children: React.ReactNode;
  /** One short line: what this would do, and why it does not. */
  note: string;
  /** Which side of the control the tag hangs off. */
  side?: "top" | "right";
  /** For a control that takes the full width of its column. */
  block?: boolean;
}) {
  const [pinned, setPinned] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  // Pinned open by a press, so it has to close on the next thing the reader
  // does — a click anywhere else, or Escape, which is what closes every other
  // transient thing on this site.
  useEffect(() => {
    if (!pinned) return;

    const away = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setPinned(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinned(false);
    };

    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [pinned]);

  return (
    <span
      ref={wrap}
      className="indev"
      data-side={side}
      data-block={block ? "true" : undefined}
      data-open={pinned ? "true" : undefined}
      onClick={() => setPinned(true)}
      onPointerLeave={() => setPinned(false)}
    >
      {children}
      <span className="indev-tag" role="note">
        <span className="indev-tag-line">In Development</span>
        <span className="indev-tag-rule" />
        <span className="indev-tag-note">{note}</span>
      </span>
    </span>
  );
}
