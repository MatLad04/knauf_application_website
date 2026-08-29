"use client";

import { useImperativeHandle, useMemo, useRef } from "react";

import type { Construction } from "@/data/constructions";
import { Spring, clamp, mix, smooth } from "@/lib/motion-loop";
import Slab from "./Slab";
import { FOCUS_PART, FOOTPRINT, place, type Point } from "./geometry";
import { edgeRotation } from "./patterns";
import { useCamera } from "./SceneRoot";

/**
 * One construction, and the explosion that takes it apart.
 *
 * The slabs are stacked along one axis with the first layer installed nearest
 * the eye, so reading the stack from the front is reading the build-up in the
 * order it goes together.
 *
 * Shut, they are packed against each other: one solid, and at the angle it is
 * seen from, the same banded section this site draws flat. As the run scrolls
 * into the construction they draw apart along that same axis, in installation
 * order, until every layer is a separate sheet with room round it — which is
 * the only state in which a name can be tied to a layer without the leaders
 * crossing the drawing. Then they close again and the next construction opens
 * out of the same solid.
 *
 * That is the whole of the movement, and it is deliberately the whole of it.
 * The camera holds still while it happens, because the layers coming apart is
 * the thing being said and two motions at once is neither.
 *
 * Nothing in here re-renders while you scroll. `apply` is called from the one
 * animation frame in `ConstructionStage` and writes transforms and opacity
 * straight onto nodes it already holds.
 */

/** How far a stack drifts as it hands over, so one recedes and one arrives. */
const ENTER_Y = 86;
const EXIT_Y = -86;
/** The share of the explosion each successive layer waits before starting. */
const STAGGER = 0.05;
/** What a layer fades to while another one is being read. */
const RESTING_OPACITY = 0.3;
/**
 * How near edge-on a face gets before it is gone.
 *
 * A plane seen along its own surface has no area to draw, and drawing it anyway
 * turns the view into a mess of tapering slivers. Every camera here is a long
 * way from either limit, so this only ever bites while the scene is between two
 * of them.
 */
const GRAZING = 0.26;

export type StackState = {
  weight: number;
  /** How far apart the layers currently are, 0 shut … 1 open. */
  open: number;
  /**
   * The four corners of each layer's face, in scene space, before the camera.
   *
   * Corners rather than a single point, because the callouts choose where on a
   * layer to land: a label on the left of the sheet points at that layer's left
   * edge, at its own height, and one on the right points at its right edge. A
   * leader that runs level and stops at the near edge of the thing it names is
   * the one thing that keeps seven of them from crossing.
   */
  faces: [Point, Point, Point, Point][];
};

export type StackHandle = {
  apply(input: {
    /** 0 while it is off stage, 1 while it is the one being read. */
    weight: number;
    /** 0 shut, 1 fully exploded. */
    open: number;
    /** What its depth is multiplied by, so two constructions morph in one volume. */
    stretch: number;
    /** Rising into place (+1), or leaving through the top (−1). */
    direction: 1 | -1;
    /** The layer being pointed at, in the drawing or in a callout. */
    activeLayer: number;
    dt: number;
    still: boolean;
  }): StackState | null;
};

/** How far in from a sheet's outline its callout lands. */
const INSET = 0.94;

export default function LayerStack({
  construction,
  scope,
  handleRef,
  onHover,
}: {
  construction: Construction;
  /**
   * Unique to this stack, and load-bearing.
   *
   * Every cut edge owns a copy of its hatch so the loop can counter-scale it,
   * and a fragment reference resolves to the first element with that id in the
   * whole document — so two stacks sharing an id would share a squash that only
   * one of them is under.
   */
  scope: string;
  handleRef: React.RefObject<StackHandle | null>;
  /** Pointing at a slab names it in the callouts. The other direction too. */
  onHover: (layerIndex: number | null) => void;
}) {
  const placed = useMemo(() => place(construction.layers), [construction]);

  const root = useRef<HTMLDivElement>(null);
  const wraps = useRef<(HTMLDivElement | null)[]>([]);
  const tops = useRef<(HTMLDivElement | null)[]>([]);
  const rights = useRef<(HTMLDivElement | null)[]>([]);
  const fronts = useRef<(HTMLDivElement | null)[]>([]);
  const topPatterns = useRef<(SVGPatternElement | null)[]>([]);
  const rightPatterns = useRef<(SVGPatternElement | null)[]>([]);

  // One spring per layer for the dim and one for the standing back, integrated
  // by hand rather than declared: both have to be written to the DOM in the
  // frame the scroll was read. Springs rather than a ramp because the answer can
  // change under them — the pointer moves from one name to the next and the
  // whole build-up has to re-part around a different layer without a jump.
  const dim = useRef(placed.map(() => new Spring(1)));
  const part = useRef(placed.map(() => new Spring(0, 0.05)));
  const marked = useRef<number>(-2);
  const camera = useCamera();

  useImperativeHandle(
    handleRef,
    () => ({
      apply({ weight, open, stretch, direction, activeLayer, dt, still }) {
        const node = root.current;
        if (!node) return null;

        if (weight <= 0.001) {
          if (node.style.visibility !== "hidden") node.style.visibility = "hidden";
          return null;
        }
        if (node.style.visibility === "hidden") node.style.visibility = "";

        // The stack has no rotation of its own: the camera is set per
        // construction and holds. Which of the three faces are worth drawing at
        // that angle is still worth asking — the face and the top share an axis
        // and come and go together, and the cut edge is their opposite.
        const theta = (camera.current.rotY * Math.PI) / 180;
        const facing = clamp(Math.abs(Math.cos(theta)) / GRAZING);
        const cut = clamp(Math.abs(Math.sin(theta)) / GRAZING);

        const faces: [Point, Point, Point, Point][] = [];
        // Off stage is below when it is coming and above when it is going.
        const travel = (direction === 1 ? ENTER_Y : EXIT_Y) * (1 - weight);
        const half = FOOTPRINT / 2;
        const reach = half * INSET;

        for (let i = 0; i < placed.length; i += 1) {
          const item = placed[i]!;
          const wrap = wraps.current[i];
          if (!wrap) continue;

          // Staggered, so the build-up comes apart in installation order rather
          // than the whole stack fanning as one board.
          const start = i * STAGGER;
          const share = smooth(clamp((open - start) / Math.max(1 - start, 0.0001)));
          const y = travel;
          // Stretched to the shared envelope while another construction is on
          // the stage with it, and to its own the rest of the time.
          const z = mix(item.zShut, item.zOpen, share) * stretch;

          const active = activeLayer === i;
          const anyActive = activeLayer >= 0;

          const d = dim.current[i]!;
          d.target = !anyActive || active ? 1 : RESTING_OPACITY;
          if (still) d.set(d.target);
          else d.step(dt);

          // Standing back from the layer being pointed at: everything in front
          // of it comes forward, everything behind it goes back, and the layer
          // itself does not move. Scaled by how far open the stack already is,
          // so a shut build-up cannot be prised apart by a hover — there is
          // nothing to point at until it has come apart on its own.
          const p = part.current[i]!;
          p.target = !anyActive || active ? 0 : (i < activeLayer ? 1 : -1) * FOCUS_PART;
          if (still) p.set(p.target);
          else p.step(dt);

          wrap.style.transform = `translate3d(0px, ${y.toFixed(2)}px, ${(z + p.value * share).toFixed(2)}px)`;

          // Opacity goes on the faces and never on anything above them: on an
          // element holding a 3D scene together it flattens everything inside,
          // and the three faces of a slab would collapse into one plane.
          const alpha = Math.pow(weight, 0.6) * d.value;

          // The cut edges are drawn at the layer's true depth and squashed to
          // the compressed depth the stack reads at — scaled rather than
          // resized, so nothing is ever laid out again — and the hatch is
          // counter-scaled by exactly as much, so a 1 mm membrane and a 200 mm
          // block are still the same material at the same grain.
          const faceDepth = Math.max(item.layer.thicknessMm * 3, 2);
          const edge = Math.max(item.t / faceDepth, 0.0001);
          const counter = Math.min(1 / edge, 60).toFixed(3);
          const rotation = edgeRotation(item.layer.pattern);

          const right = rights.current[i];
          if (right) {
            right.style.transform = `translateX(${half}px) rotateY(90deg) scaleX(${edge.toFixed(4)})`;
            right.style.opacity = (alpha * cut).toFixed(3);
          }
          const rightPattern = rightPatterns.current[i];
          if (rightPattern) {
            rightPattern.setAttribute(
              "patternTransform",
              `scale(${counter} 1) rotate(${rotation})`,
            );
          }

          const top = tops.current[i];
          if (top) {
            top.style.transform = `translateY(${-half}px) rotateX(90deg) scaleY(${edge.toFixed(4)})`;
            top.style.opacity = (alpha * facing).toFixed(3);
          }
          const topPattern = topPatterns.current[i];
          if (topPattern) {
            topPattern.setAttribute("patternTransform", `scale(1 ${counter}) rotate(${rotation})`);
          }

          const front = fronts.current[i];
          if (front) {
            front.style.transform = `translateZ(${(item.t / 2).toFixed(2)}px)`;
            front.style.opacity = (alpha * facing).toFixed(3);
          }

          // The face this layer is named against: its four corners, on the
          // plane the front face is drawn on, in the scene's own coordinates.
          // Parted along with the slab, so a leader stays on its layer while the
          // rest of the build-up stands back from it.
          const zf = z + p.value * share + item.t / 2;
          faces.push([
            { x: -reach, y: -reach + y, z: zf },
            { x: reach, y: -reach + y, z: zf },
            { x: reach, y: reach + y, z: zf },
            { x: -reach, y: reach + y, z: zf },
          ]);
        }

        // The held outline is a class rather than a per-frame style, and it is
        // only touched when the answer changes.
        if (marked.current !== activeLayer) {
          for (let i = 0; i < wraps.current.length; i += 1) {
            const wrap = wraps.current[i];
            if (!wrap) continue;
            if (i === activeLayer) wrap.setAttribute("data-held", "true");
            else wrap.removeAttribute("data-held");
          }
          marked.current = activeLayer;
        }

        return { weight, open, faces };
      },
    }),
    [placed, camera],
  );

  return (
    <div ref={root} className="stack-group" role="group" aria-label={construction.title}>
      {placed.map((item, i) => (
        <Slab
          key={item.layer.id}
          layer={item.layer}
          index={i}
          faceDepth={Math.max(item.layer.thicknessMm * 3, 2)}
          patternId={`p-${scope}-${item.layer.id}`}
          label={`${construction.title}, layer ${i + 1}: ${item.layer.name}`}
          onActivate={onHover}
          refs={{
            wrap: (el) => {
              wraps.current[i] = el;
            },
            top: (el) => {
              tops.current[i] = el;
            },
            right: (el) => {
              rights.current[i] = el;
            },
            front: (el) => {
              fronts.current[i] = el;
            },
            topPattern: (el) => {
              topPatterns.current[i] = el;
            },
            rightPattern: (el) => {
              rightPatterns.current[i] = el;
            },
          }}
        />
      ))}
    </div>
  );
}
