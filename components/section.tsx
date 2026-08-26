import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

/**
 * Page gutter. Everything on the site lines up to this measure.
 *
 * A drawing sheet has a frame, and content runs inside it rather than off the
 * edge of the paper — which is also the honest answer to a catalogue on a
 * 27-inch monitor. So the measure grows with the viewport and then stops:
 * 1680px is wide enough for four product cards and a filter rail without a
 * line of prose ever running past a readable length, and the gutter opens up
 * rather than the column stretching.
 */
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[105rem] px-5 sm:px-8 lg:px-12 xl:px-16 ${className}`}>
      {children}
    </div>
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
        <h2 id={id} className="display text-[clamp(1.75rem,3.6vw,2.75rem)]">
          {title}
        </h2>
        {lead && <p className="mt-3 max-w-[52ch] text-muted">{lead}</p>}
      </div>
      {href && hrefLabel && (
        <Link href={href} className="btn btn-quiet group shrink-0">
          {hrefLabel}
          <ArrowRight
            size={16}
            weight="bold"
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
