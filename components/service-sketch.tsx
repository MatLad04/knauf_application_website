/**
 * One drawing per service, in the same hand as the rest of the site.
 *
 * The catalogue already divides its imagery two ways: photography says what a
 * material *is*, drawn hatch says how a wall is *built*. A service is neither —
 * it is a thing somebody does — so these are the third case, and they are drawn
 * as the instrument or the artefact the service produces: a specification
 * sheet, a temperature gradient, a plumb line, a certified hour, a cut sample.
 * An icon set would have been five glyphs; these are five different objects,
 * which is the same argument the page itself makes.
 *
 * All hairline, all `currentColor`, so they take the theme and sit at whatever
 * weight the section around them sets.
 */

const SKETCHES: Record<string, () => React.ReactElement> = {
  /** 01 — the specification, as the sheet it is issued on. */
  specification: () => (
    <>
      <rect x="34" y="14" width="132" height="172" />
      <rect x="42" y="22" width="116" height="156" strokeDasharray="3 3" opacity="0.5" />
      {/* The layers, in installation order, as the schedule prints them. */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <line x1="52" y1={44 + i * 17} x2="60" y2={44 + i * 17} />
          <line x1="66" y1={44 + i * 17} x2={148 - (i % 3) * 16} y2={44 + i * 17} opacity="0.55" />
        </g>
      ))}
      {/* The title block, bottom right, where a real sheet carries it. */}
      <rect x="98" y="148" width="60" height="30" />
      <line x1="98" y1="158" x2="158" y2="158" />
      <line x1="128" y1="158" x2="128" y2="178" />
    </>
  ),

  /** 02 — the temperature falling through the build-up, and where it meets dew. */
  dewpoint: () => (
    <>
      {/* The section: substrate, board, skin. */}
      <rect x="26" y="34" width="52" height="132" opacity="0.45" />
      <rect x="78" y="34" width="72" height="132" />
      <rect x="150" y="34" width="12" height="132" opacity="0.45" />
      {/* Inside is warm, outside is cold; the line falls across the insulation. */}
      <path d="M26 56 L78 62 L150 146 L162 152" strokeWidth="1.6" />
      {/* Dew point, dashed, never touching the falling line. */}
      <path d="M26 96 L78 100 L150 158 L162 162" strokeDasharray="4 4" opacity="0.6" />
      <circle cx="118" cy="112" r="3.5" fill="currentColor" stroke="none" />
      <line x1="118" y1="112" x2="118" y2="182" opacity="0.4" />
      <line x1="20" y1="34" x2="20" y2="166" opacity="0.4" />
      <line x1="16" y1="34" x2="24" y2="34" opacity="0.4" />
      <line x1="16" y1="166" x2="24" y2="166" opacity="0.4" />
    </>
  ),

  /** 03 — the scaffold it is checked from, and the plumb line it is checked with. */
  inspection: () => (
    <>
      <line x1="46" y1="16" x2="46" y2="186" />
      <line x1="150" y1="16" x2="150" y2="186" />
      {[40, 92, 144].map((y) => (
        <line key={y} x1="46" y1={y} x2="150" y2={y} />
      ))}
      <line x1="46" y1="92" x2="150" y2="40" opacity="0.5" />
      <line x1="46" y1="144" x2="150" y2="92" opacity="0.5" />
      {[46, 150].map((x) =>
        [40, 92, 144].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="currentColor" stroke="none" />
        )),
      )}
      {/* The plumb bob, hanging off the top lift. */}
      <line x1="98" y1="16" x2="98" y2="132" strokeDasharray="2 3" />
      <path d="M92 132 L104 132 L98 156 Z" fill="currentColor" stroke="none" />
    </>
  ),

  /** 04 — one hour, certified. */
  training: () => (
    <>
      <circle cx="98" cy="96" r="62" />
      <circle cx="98" cy="96" r="54" opacity="0.35" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const long = i % 3 === 0;
        return (
          <line
            key={i}
            x1={98 + Math.cos(a) * (long ? 44 : 48)}
            y1={96 + Math.sin(a) * (long ? 44 : 48)}
            x2={98 + Math.cos(a) * 54}
            y2={96 + Math.sin(a) * 54}
            opacity={long ? 1 : 0.5}
          />
        );
      })}
      {/* The hour itself, swept from twelve to one. */}
      <path
        d="M98 96 L98 42 A54 54 0 0 1 145 69 Z"
        fill="currentColor"
        opacity="0.1"
        stroke="none"
      />
      <path d="M98 96 L98 42 A54 54 0 0 1 145 69 Z" />
      <circle cx="98" cy="96" r="3" fill="currentColor" stroke="none" />
      <line x1="46" y1="176" x2="150" y2="176" opacity="0.5" />
      <line x1="66" y1="184" x2="130" y2="184" opacity="0.3" />
    </>
  ),

  /** 05 — the build-up as an object, cut. */
  sample: () => (
    <>
      {/* Front face, layered at the depths the wall is. */}
      {[
        { y: 74, h: 46, o: 0.14 },
        { y: 120, h: 34, o: 0.3 },
        { y: 154, h: 10, o: 0.5 },
      ].map((band) => (
        <rect
          key={band.y}
          x="40"
          y={band.y}
          width="104"
          height={band.h}
          fill="currentColor"
          opacity={band.o}
          stroke="none"
        />
      ))}
      <rect x="40" y="74" width="104" height="90" />
      <line x1="40" y1="120" x2="144" y2="120" />
      <line x1="40" y1="154" x2="144" y2="154" />
      {/* The top face, thrown back in axonometric. */}
      <path d="M40 74 L74 44 L178 44 L144 74 Z" />
      <path d="M144 74 L178 44 L178 134 L144 164 Z" opacity="0.55" />
      <path d="M144 120 L178 90" opacity="0.4" />
      <path d="M144 154 L178 124" opacity="0.4" />
    </>
  ),
};

export type SketchKey = keyof typeof SKETCHES;

export default function ServiceSketch({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const draw = SKETCHES[name];
  if (!draw) return null;

  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    >
      {draw()}
    </svg>
  );
}
