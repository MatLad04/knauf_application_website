/**
 * The animation layer is CSS only. Entrances are scroll-driven or run on load,
 * so nothing depends on JavaScript: a browser without support for the
 * scroll timeline, and a visitor with JavaScript disabled, both get the
 * finished state, which is also what `prefers-reduced-motion` resolves to.
 */

type Props = { children: React.ReactNode; className?: string };

/** Rises into place as it enters the viewport. Marks where a section begins. */
export function Reveal({ children, className = "" }: Props) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

/** Runs once on load, for content that is already in view. */
export function Enter({ children, className = "", delay = 0 }: Props & { delay?: number }) {
  return (
    <div className={`enter ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
