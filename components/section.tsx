import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

/** Page gutter. Everything on the site lines up to this measure. */
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[92rem] px-4 sm:px-8 ${className}`}>{children}</div>;
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
