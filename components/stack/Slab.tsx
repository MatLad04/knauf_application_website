"use client";

import { FOOTPRINT } from "./geometry";
import { LocalPattern, edgeRotation, fillFor } from "./patterns";
import type { Layer } from "@/data/constructions";

/**
 * One layer of a construction, drawn as the corner of a box.
 *
 * Three faces and no more: the one you are looking at, and the two cut edges
 * that say how deep it is. A closed box would need a back, a bottom and a left
 * that are never visible and would double the node count for nothing.
 *
 * Every face is drawn the way this site draws a section, because that is what
 * it is: a sheet of paper, the material's hatch on it, a hairline round it. The
 * sheet is opaque, which is the change that made the stack readable. Seven
 * translucent hatches stacked behind each other are one grey square and a
 * moiré; opaque, each layer covers the ones behind it except for the strip the
 * explosion has opened, and those strips read left to right as the bands of the
 * flat section — same order, same hatches, same drawing, pulled apart.
 *
 * The two cut edges carry their own copy of the hatch rather than the shared
 * sprite's. They are drawn at the layer's true depth and squashed to the
 * compressed depth the stack reads at, and the scroll loop undoes that squash
 * on the pattern so the hatch stays true at any depth — which is what stops a
 * 1 mm membrane and a 200 mm block looking like two different materials.
 *
 * The slab holds no state and animates nothing itself. `LayerStack` writes its
 * transforms inside the scroll loop; this only says what the thing is.
 */

export type SlabRefs = {
  wrap: (el: HTMLDivElement | null) => void;
  top: (el: HTMLDivElement | null) => void;
  right: (el: HTMLDivElement | null) => void;
  front: (el: HTMLDivElement | null) => void;
  topPattern: (el: SVGPatternElement | null) => void;
  rightPattern: (el: SVGPatternElement | null) => void;
};

export default function Slab({
  layer,
  index,
  faceDepth,
  patternId,
  refs,
  onActivate,
  label,
}: {
  layer: Layer;
  index: number;
  /** The rendered depth of the cut edges. Scaled at runtime, never re-laid-out. */
  faceDepth: number;
  /** Unique per slab, because each one owns two patterns. */
  patternId: string;
  refs: SlabRefs;
  /** Naming this layer, or letting go of it. Pointer or keyboard, either way. */
  onActivate: (index: number | null) => void;
  label: string;
}) {
  const drawn = layer.pattern !== "hairline";
  const rotate = edgeRotation(layer.pattern);

  return (
    <div
      ref={refs.wrap}
      className="stack-slab"
      data-index={index}
      tabIndex={0}
      role="listitem"
      aria-label={label}
      onMouseEnter={() => onActivate(index)}
      onMouseLeave={() => onActivate(null)}
      onFocus={() => onActivate(index)}
      onBlur={() => onActivate(null)}
    >
      {/* The cut edge along the top. Same hatch as the face, turned, which is
          how a drawing says "this is the thickness of what you were looking
          at". */}
      <div
        ref={refs.top}
        className="stack-face stack-face-top"
        style={{
          width: FOOTPRINT,
          height: faceDepth,
          marginLeft: -FOOTPRINT / 2,
          marginTop: -faceDepth / 2,
        }}
      >
        <Sheet
          w={FOOTPRINT}
          h={faceDepth}
          fill={drawn ? `url(#${patternId}-t)` : undefined}
          defs={
            <LocalPattern
              id={`${patternId}-t`}
              pattern={layer.pattern}
              ref={refs.topPattern}
              rotate={rotate}
            />
          }
        />
      </div>

      {/* The cut edge down the side: the one the callouts on the right of the
          sheet point at, and the one that carries the layer's depth. */}
      <div
        ref={refs.right}
        className="stack-face stack-face-right"
        style={{
          width: faceDepth,
          height: FOOTPRINT,
          marginLeft: -faceDepth / 2,
          marginTop: -FOOTPRINT / 2,
        }}
      >
        <Sheet
          w={faceDepth}
          h={FOOTPRINT}
          fill={drawn ? `url(#${patternId}-r)` : undefined}
          defs={
            <LocalPattern
              id={`${patternId}-r`}
              pattern={layer.pattern}
              ref={refs.rightPattern}
              rotate={rotate}
            />
          }
        />
      </div>

      {/* The face of the slab, hatched with the same material as its cut edges
          and at the same grain. It used to be left empty on the argument that
          seven stacked hatches read as static — true while the sheets were
          transparent, and no longer true now that they are not: only the strip
          of each face the explosion has uncovered is ever visible, and a strip
          of hatch is exactly how a section names a material. */}
      <div
        ref={refs.front}
        className="stack-face stack-face-front"
        style={{
          width: FOOTPRINT,
          height: FOOTPRINT,
          marginLeft: -FOOTPRINT / 2,
          marginTop: -FOOTPRINT / 2,
        }}
      >
        <Sheet w={FOOTPRINT} h={FOOTPRINT} fill={fillFor(layer.pattern)} />
      </div>
    </div>
  );
}

/**
 * A face: a sheet of paper, a hatch on it, a hairline round it.
 *
 * `non-scaling-stroke` is the whole reason this is an SVG rather than a bordered
 * div. The stack is scaled every frame, and a 1 px border would thicken and
 * thin with it — which is exactly the thing that would stop it looking like a
 * drawing.
 */
function Sheet({
  w,
  h,
  fill,
  defs,
}: {
  w: number;
  h: number;
  fill: string | undefined;
  defs?: React.ReactNode;
}) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      {defs && <defs>{defs}</defs>}
      <rect className="stack-sheet" x="0" y="0" width={w} height={h} />
      {fill && <rect x="0" y="0" width={w} height={h} fill={fill} />}
      <rect
        x="0.5"
        y="0.5"
        width={Math.max(w - 1, 0)}
        height={Math.max(h - 1, 0)}
        fill="none"
        stroke="var(--color-edge)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
