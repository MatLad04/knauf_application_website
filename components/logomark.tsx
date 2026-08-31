/**
 * The same three layers as the favicon — render, insulation, substrate — cut to
 * a section through a wall. It is drawn in `currentColor` rather than in the
 * favicon's fixed greys so it belongs to whichever theme is on and turns with
 * the wordmark on hover, and the layers keep the favicon's proportions so the
 * tab and the bar are recognisably the same mark.
 *
 * It sits on its own because two things print it now: the bar, at the size of a
 * line of type, and the front door, at the size of a mark on a title page.
 */
export default function Logomark({ className = "logomark shrink-0 rounded-[5px]" }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect width="32" height="32" fill="currentColor" />
      <g fill="var(--color-surface)">
        <rect x="6" y="7" width="20" height="4" />
        <rect x="6" y="13" width="20" height="7" opacity="0.55" />
        <rect x="6" y="22" width="20" height="4" opacity="0.8" />
      </g>
    </svg>
  );
}
