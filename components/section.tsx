import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

/**
 * Page gutter. Everything on the site lines up to this measure.
 *
 * Full width, with a margin that opens as the screen does. The measure used to
 * stop at 1680px and let the gutter take the rest, which on a wide monitor put
 * a band of empty page down both sides of a catalogue that had four more
 * columns in it. Prose is what actually needs a limit, and every block of it
 * sets its own — so the page can run to the edges without a line of text ever
 * running past a readable length.
 */
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 ${className}`}>{children}</div>
  );
}

/**
 * Heading, one line of lead, and an optional link out. Stacked, never split
 * across columns, so a section always has one message.
 */
export function SectionHead({
  id,
  title,
  lead,
  href,
  hrefLabel,
}: {
  id: string;
  title: string;
  lead?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div>
        <h2 id={id} className="display t-section">
          {title}
        </h2>
        {lead && <p className="mt-3 max-w-[52ch] text-muted">{lead}</p>}
      </div>
      {href && hrefLabel && (
        <Link href={href} className="btn btn-quiet shrink-0">
          {hrefLabel}
          <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
