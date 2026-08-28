import { permanentRedirect } from "next/navigation";

/**
 * The constructions are a section of the landing page now, not a page of their
 * own: the argument they make — a wall is a stack, and there are five of them —
 * is the argument the landing page opens with, and splitting the two put the
 * evidence behind a navigation item most visitors never opened.
 *
 * The URL stays, because it was shareable, it is in the sitemap, and the
 * catalogue's own application filters were reachable from it.
 */
export default function ApplicationsPage(): never {
  permanentRedirect("/#applications");
}
