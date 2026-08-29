import type { Pattern } from "@/data/constructions";

/**
 * The hatches, once, for the whole explorer.
 *
 * Every face of every slab and every band of the section is its own inline
 * `<svg>`, and a fragment reference resolves across the document — so the
 * patterns live in one hidden sprite rather than being re-declared thirty times
 * over. It is the same set the site's section drawings already use, copied out
 * of `components/construction-figure.tsx` at the same sizes, weights and
 * opacities: an insulation hatch here has to be indistinguishable from an
 * insulation hatch on the pitched-roof detail, because it is meant to read as
 * the same drawing.
 *
 * A cut edge is hatched at a different angle from the face it belongs to —
 * that is how a section says "this is the thickness of the thing you were just
 * looking at" — so each pattern has an edge variant turned ninety degrees from
 * the face variant. Nothing else about it changes.
 */

/** Which hatch fills a face of this layer, and which fills its cut edges. */
export function fillFor(pattern: Pattern, edge = false): string | undefined {
  if (pattern === "hairline") return undefined;
  return `url(#ex-${pattern}${edge ? "-edge" : ""})`;
}

const HATCH = "var(--color-muted)";

/**
 * The tiles again, as data, for the faces that have to carry their own copy.
 *
 * A cut edge is drawn at its true depth and then squashed by a transform to the
 * compressed depth Part A reads at — and a transform squashes the hatch with the
 * geometry. Turned a quarter of the way round, where the cut edge is the thing
 * you are looking at, that is a visibly wrong material.
 *
 * So the two cut faces of every slab own their pattern rather than sharing the
 * sprite's, and the scroll loop writes a `patternTransform` that undoes exactly
 * the squash currently on the face. The hatch is then true at every angle and
 * every depth, which is the whole reason the drawing survives being turned.
 */
export type Tile = { w: number; h: number; rotate: number; draw: React.ReactNode };

export const TILES: Record<Exclude<Pattern, "hairline">, Tile> = {
  hatch: {
    w: 7,
    h: 7,
    rotate: 38,
    draw: <path d="M0 3.5h7" stroke={HATCH} strokeWidth="0.8" opacity="0.7" />,
  },
  rule: {
    w: 9,
    h: 9,
    rotate: 0,
    draw: <path d="M0 2h9M0 6.5h9" stroke={HATCH} strokeWidth="0.7" opacity="0.55" />,
  },
  stipple: {
    w: 13,
    h: 13,
    rotate: 0,
    draw: (
      <>
        <circle cx="3" cy="4" r="1.2" fill={HATCH} opacity="0.5" />
        <circle cx="9" cy="8.5" r="1.7" fill={HATCH} opacity="0.4" />
        <circle cx="6" cy="11.5" r="0.8" fill={HATCH} opacity="0.45" />
      </>
    ),
  },
  "dense-hatch": {
    w: 6,
    h: 6,
    rotate: 0,
    draw: (
      <>
        <circle cx="1.6" cy="1.6" r="0.65" fill={HATCH} opacity="0.7" />
        <circle cx="4.4" cy="4.4" r="0.6" fill={HATCH} opacity="0.7" />
      </>
    ),
  },
};

/** A cut edge is hatched ninety degrees off the face it belongs to. */
export const edgeRotation = (pattern: Pattern): number =>
  pattern === "hairline" ? 0 : TILES[pattern].rotate + 90;

/** One face's own copy of a tile, so it can be counter-scaled per frame. */
export function LocalPattern({
  id,
  pattern,
  rotate,
  ref,
}: {
  id: string;
  pattern: Pattern;
  rotate: number;
  ref?: (el: SVGPatternElement | null) => void;
}) {
  if (pattern === "hairline") return null;
  const tile = TILES[pattern];
  return (
    <pattern
      ref={ref}
      id={id}
      width={tile.w}
      height={tile.h}
      patternUnits="userSpaceOnUse"
      patternTransform={`rotate(${rotate})`}
    >
      {tile.draw}
    </pattern>
  );
}

export default function PatternSprite() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", inlineSize: 0, blockSize: 0, overflow: "hidden" }}
    >
      <defs>
        {/* Insulation: raked lines. */}
        <pattern
          id="ex-hatch"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(38)"
        >
          <path d="M0 3.5h7" stroke={HATCH} strokeWidth="0.8" opacity="0.7" />
        </pattern>
        <pattern
          id="ex-hatch-edge"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(128)"
        >
          <path d="M0 3.5h7" stroke={HATCH} strokeWidth="0.8" opacity="0.7" />
        </pattern>

        {/* Timber and board linings: the grain, cut across. */}
        <pattern id="ex-rule" width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M0 2h9M0 6.5h9" stroke={HATCH} strokeWidth="0.7" opacity="0.55" />
        </pattern>
        <pattern
          id="ex-rule-edge"
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(90)"
        >
          <path d="M0 2h9M0 6.5h9" stroke={HATCH} strokeWidth="0.7" opacity="0.55" />
        </pattern>

        {/* Masonry and concrete: aggregate, never a hatch, so it can never be
            mistaken for one of the insulation layers. */}
        <pattern id="ex-stipple" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="1.2" fill={HATCH} opacity="0.5" />
          <circle cx="9" cy="8.5" r="1.7" fill={HATCH} opacity="0.4" />
          <circle cx="6" cy="11.5" r="0.8" fill={HATCH} opacity="0.45" />
        </pattern>
        <pattern
          id="ex-stipple-edge"
          width="13"
          height="13"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(90)"
        >
          <circle cx="3" cy="4" r="1.2" fill={HATCH} opacity="0.5" />
          <circle cx="9" cy="8.5" r="1.7" fill={HATCH} opacity="0.4" />
          <circle cx="6" cy="11.5" r="0.8" fill={HATCH} opacity="0.45" />
        </pattern>

        {/* Wet trades and screed: a fine, dense stipple, which is how this site
            has always drawn mortar, base coat, render and screed. */}
        <pattern id="ex-dense-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="0.65" fill={HATCH} opacity="0.7" />
          <circle cx="4.4" cy="4.4" r="0.6" fill={HATCH} opacity="0.7" />
        </pattern>
        <pattern
          id="ex-dense-hatch-edge"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(90)"
        >
          <circle cx="1.6" cy="1.6" r="0.65" fill={HATCH} opacity="0.7" />
          <circle cx="4.4" cy="4.4" r="0.6" fill={HATCH} opacity="0.7" />
        </pattern>

        {/* Membranes and vapour control layers have no fill at all: at true
            scale they are a single hairline, and that is the whole drawing. */}

        {/* The paper Part B is drawn on, at the ruling the configurator's own
            panel already uses. */}
        <pattern id="ex-paper" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M0 0h50M0 0v50" stroke="var(--color-rule)" strokeWidth="1" fill="none" />
        </pattern>
      </defs>
    </svg>
  );
}
