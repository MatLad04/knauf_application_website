"use client";

import { useEffect } from "react";

/**
 * Smooth scrolling for in-page anchors, and only for those.
 *
 * `scroll-behavior: smooth` on `html` is the obvious way to do this and it
 * breaks the router: the App Router resets the scroll position itself on a
 * navigation, the declaration turns that reset into an animation the router is
 * not waiting for, and the new page lands wherever the old one happened to be.
 * Clicking a category on the landing page arrived a thousand pixels down the
 * catalogue.
 *
 * So the behaviour is attached to the thing that actually wants it — a link to
 * an id on the page you are already on — and nothing else. Anyone who asked for
 * less motion gets the jump, which is what the declaration would have given
 * them anyway.
 */
export default function SmoothAnchors() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href?.startsWith("#") || href === "#") return;

      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;

      event.preventDefault();
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });

      // The hash still belongs in the URL — it is what makes the position
      // shareable and what the back button restores.
      history.pushState(null, "", href);

      // Scrolling is not focusing. Without this the next Tab starts from the
      // top of the document rather than from where the reader is looking.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
