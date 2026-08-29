"use client";

import { useImperativeHandle, useRef } from "react";

import type { Construction } from "@/data/constructions";
import { Spring, clamp, mix } from "@/lib/motion-loop";
import { project, type Point } from "./geometry";
import { useCamera } from "./SceneRoot";
import type { StackState } from "./LayerStack";

/**
 * The numbers, the names, and the leaders that tie them to the layers.
 *
 * They are not in the scene. Nothing inside a perspective transform can stay
 * upright — a counter-rotation gets the right facing and still shears the
 * glyphs — so the annotations lie flat on the glass above the geometry and the
 * point each one is aimed at is projected by hand, with the same matrix the
 * browser is applying to the slabs.
 *
 * They only appear once the construction is fully open, and that is the point
 * of the explosion rather than a consequence of it. Shut, the layers are one
 * solid and there is nothing a name could honestly point at; open, each one is
 * a separate sheet with air round it, and only then is a leader a claim about
 * which layer is which.
 *
 * Three rules keep seven of them legible, and they are the whole of the layout:
 *
 * — Two columns, split by where the layers actually are on the sheet. The near
 *   half of the build-up is named down the left margin and the far half down
 *   the right, in the order they appear across the drawing, so a column is read
 *   in the order the construction goes together.
 * — One even spacing down each column, so it reads as a legend rather than as a
 *   scatter of text pushed apart only as far as it had to be.
 * — And then the leader is aimed rather than the label placed: each one lands in
 *   the strip of its own layer that is actually showing, at the height of its own
 *   row. The two are what keep seven of them apart — landing in the visible
 *   strip puts the dots in the same left-to-right order as the rows, and solving
 *   for the row's own height makes each leader a level rule, so a fan of them
 *   can no more cross than a set of parallel lines can.
 */

/** How far in from the edge of the stage a column of labels sits. */
const MARGIN = 6;
/**
 * How far apart two labels in one column are set.
 *
 * Bounded at both ends: below the floor two names touch, and past the ceiling a
 * column of four is taller than the sheet.
 */
const MIN_ROW = 66;
const MAX_ROW = 98;
/** How close to the top and bottom edges of the stage a column may run. */
const PAD = 26;
/** The horizontal run a leader makes before it turns toward its layer. */
const SHOULDER = 16;
/** How far in from the corners of a sheet a leader may land. */
const REACH = 0.07;
/** The least a leader may land above the one below it in the same column. */
const ANCHOR_GAP = 13;
/**
 * When the names arrive, as a share of the explosion.
 *
 * The names are what the explosion is for, so they are held back until it has
 * all but finished — by 0.72 the sheets are plainly separate and what is left is
 * the last of the travel — and they are timed to land exactly as it settles.
 * Earlier they read as labels on a drawing that is still moving; later there is
 * a beat of nothing, which reads as a delay rather than as an arrival.
 *
 * Each takes `NAME_FADE` of the explosion to come up, and they start a little
 * apart, in the order the layers came apart in. The spread is taken out of the
 * window rather than added to it, so the last of them is at full strength on the
 * same frame the last sheet stops.
 */
const NAME_IN = 0.72;
const NAME_FADE = 0.2;

/** Eased at both ends, for a fade that starts and stops rather than ramps. */
const smoothstep = (from: number, to: number, v: number) => {
  const t = clamp((v - from) / (to - from));
  return t * t * (3 - 2 * t);
};

export type CalloutHandle = {
  apply(input: {
    state: StackState | null;
    size: { w: number; h: number };
    activeLayer: number;
    dt: number;
    still: boolean;
  }): void;
};

type Row = {
  i: number;
  left: boolean;
  /** Where the label sits. */
  x: number;
  y: number;
  /** Where its leader lands. */
  ax: number;
  ay: number;
};

export default function Callouts({
  construction,
  handleRef,
  onHover,
}: {
  construction: Construction;
  handleRef: React.RefObject<CalloutHandle | null>;
  onHover: (layerIndex: number | null) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const origin = useRef<SVGGElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const leaders = useRef<(SVGPathElement | null)[]>([]);
  const dots = useRef<(SVGCircleElement | null)[]>([]);

  const camera = useCamera();
  const held = useRef(construction.layers.map(() => new Spring(0)));
  const rows = useRef<Row[]>([]);
  const corners = useRef<{ x: number; y: number }[][]>([]);
  const reach = useRef<{ top: { x: number; y: number }; bottom: { x: number; y: number } }[]>([]);

  useImperativeHandle(
    handleRef,
    () => ({
      apply({ state, size, activeLayer, dt, still }) {
        const node = root.current;
        if (!node) return;

        // Nothing to draw until the stack is nearly open, and nothing to draw at
        // all for one that is leaving the stage.
        const open = state ? state.open : 0;
        const weight = state ? state.weight : 0;
        if (weight <= 0.004 || open <= NAME_IN) {
          if (node.style.display !== "none") node.style.display = "none";
          return;
        }
        if (node.style.display === "none") node.style.display = "";

        // The leaders are drawn in CSS pixels with the origin in the middle of
        // the stage, which is where the projection puts its zero. The SVG has
        // no viewBox, so the shift has to be written rather than declared.
        const shift = `translate(${(size.w / 2).toFixed(1)} ${(size.h / 2).toFixed(1)})`;
        if (origin.current && origin.current.getAttribute("transform") !== shift) {
          origin.current.setAttribute("transform", shift);
        }

        // Every sheet's four corners, on the glass.
        const faces = state!.faces;
        const total = faces.length;
        const spread = Math.max(1 - NAME_IN - NAME_FADE, 0);
        const flat = corners.current;
        flat.length = 0;
        for (let i = 0; i < faces.length; i += 1) {
          const face = faces[i]!;
          flat.push([
            project(face[0] as Point, camera.current),
            project(face[1] as Point, camera.current),
            project(face[2] as Point, camera.current),
            project(face[3] as Point, camera.current),
          ]);
        }

        // Which column each name goes in: by where its layer actually landed
        // across the sheet, not by its number.
        //
        // With the stack open at a three-quarter view the two are the same
        // thing — the layers step across the drawing in the order they are
        // installed — so the left column reads 01 downward and the right one
        // carries on from it. Sorting by the drawing rather than by the number
        // is what guarantees it: a column whose rows are in the order their
        // layers appear cannot have two of its leaders cross.
        const order = flat
          .map((c, i) => ({ i, x: (c[0]!.x + c[1]!.x + c[2]!.x + c[3]!.x) / 4 }))
          .sort((a, b) => a.x - b.x);
        // The short column is the near one.
        //
        // Rounded down rather than up, so seven layers are named three and four
        // and five are named two and three. The far half of an open stack is
        // the crowded half — the sheets are smaller there, stepped further up
        // the drawing and closer together — so the column that has to reach
        // into it is the one that should carry the extra row, and the near
        // half is left with the room its larger sheets already have.
        const half = Math.floor(order.length / 2);

        // How far across each sheet its own visible strip begins.
        //
        // Every layer but the nearest is partly behind the one in front of it:
        // they are offset by the same amount all the way down the stack, so what
        // is showing of each is a band at its far edge exactly as wide as the
        // explosion opened. A leader has to land in that band. Aimed anywhere
        // else it terminates on the face of the layer in front, which is a
        // drawing that names the wrong material.
        const strips = new Array<number>(order.length).fill(0.5);
        for (let k = 0; k < order.length; k += 1) {
          const c = flat[order[k]!.i]!;
          const across = c[1]!.x - c[0]!.x;
          const step =
            k + 1 < order.length
              ? order[k + 1]!.x - order[k]!.x
              : k > 0
                ? order[k]!.x - order[k - 1]!.x
                : Math.abs(across);
          const showing = Math.abs(across) < 1 ? 1 : clamp(Math.abs(step / across), 0.08, 1);
          strips[order[k]!.i] = across < 0 ? 0.5 * showing : 1 - 0.5 * showing;
        }

        // The line down each sheet that its leader is allowed to land on: its
        // visible strip, from the top of the sheet to the bottom.
        const lines = reach.current;
        lines.length = 0;
        for (let i = 0; i < flat.length; i += 1) {
          const c = flat[i]!;
          const u = strips[i]!;
          const a = { x: mix(c[0]!.x, c[1]!.x, u), y: mix(c[0]!.y, c[1]!.y, u) };
          const b = { x: mix(c[3]!.x, c[2]!.x, u), y: mix(c[3]!.y, c[2]!.y, u) };
          lines.push(a.y <= b.y ? { top: a, bottom: b } : { top: b, bottom: a });
        }

        const placed = rows.current;
        placed.length = 0;
        const room = size.h - 2 * PAD;

        for (const left of [true, false]) {
          const column = left ? order.slice(0, half) : order.slice(half);
          if (column.length === 0) continue;

          // The band every layer in this column can be reached in.
          //
          // The sheets step up the drawing as they step across it, so their
          // strips only overlap in the middle — and that overlap is where the
          // column wants to sit. Ruled there, and no wider than the overlap,
          // every leader comes out level, which is the strongest guarantee
          // there is that no two of them cross: a set of horizontal lines
          // cannot.
          let lo = -Infinity;
          let hi = Infinity;
          for (const entry of column) {
            const line = lines[entry.i]!;
            lo = Math.max(lo, mix(line.top.y, line.bottom.y, REACH));
            hi = Math.min(hi, mix(line.top.y, line.bottom.y, 1 - REACH));
          }

          const gaps = Math.max(column.length - 1, 1);
          const spacing = Math.max(
            Math.min((hi - lo) / gaps, MAX_ROW, room / column.length),
            MIN_ROW,
          );
          const height = (column.length - 1) * spacing;
          const edge = Math.max(size.h / 2 - PAD - height / 2, 0);
          const centre = Math.max(Math.min((lo + hi) / 2, edge), -edge);
          const x = left ? -size.w / 2 + MARGIN : size.w / 2 - MARGIN;

          // Where each leader lands, in one pass down the column and one back.
          //
          // Level if the sheet can be reached at the row's own height, and
          // otherwise as near to it as the sheet allows — but never above the
          // one before it. A steep pose stacks the sheets faster than a column
          // of names can be set, and then the two orders disagree: the row
          // above wants a landing below the row beneath it, and the leaders
          // change places. This is the same thing a draughtsman does by hand,
          // and it is why the numbers can be left in the order the layers are
          // built in rather than being re-sorted by where they ended up.
          const ys = column.map((entry, k) => {
            const line = lines[entry.i]!;
            const top = mix(line.top.y, line.bottom.y, REACH);
            const bottom = mix(line.top.y, line.bottom.y, 1 - REACH);
            return Math.max(Math.min(centre - height / 2 + k * spacing, bottom), top);
          });
          for (let k = 1; k < ys.length; k += 1) {
            const line = lines[column[k]!.i]!;
            const bottom = mix(line.top.y, line.bottom.y, 1 - REACH);
            ys[k] = Math.min(Math.max(ys[k]!, ys[k - 1]! + ANCHOR_GAP), bottom);
          }
          for (let k = ys.length - 2; k >= 0; k -= 1) {
            const line = lines[column[k]!.i]!;
            const top = mix(line.top.y, line.bottom.y, REACH);
            ys[k] = Math.max(Math.min(ys[k]!, ys[k + 1]! - ANCHOR_GAP), top);
          }

          for (let k = 0; k < column.length; k += 1) {
            const i = column[k]!.i;
            const y = centre - height / 2 + k * spacing;
            const anchor = at(lines[i]!, ys[k]!);
            placed.push({ i, left, x, y, ax: anchor.x, ay: anchor.y });
          }
        }

        for (const row of placed) {
          const i = row.i;

          const spring = held.current[i]!;
          spring.target = activeLayer === i ? 1 : 0;
          if (still) spring.set(spring.target);
          else spring.step(dt);
          const on = clamp(spring.value);

          // The names arrive in the order the layers came apart in, and the last
          // of them lands as the last sheet stops.
          const arrives = NAME_IN + (total > 1 ? (i / (total - 1)) * spread : 0);
          const alpha = weight * smoothstep(arrives, arrives + NAME_FADE, open);

          const label = labels.current[i];
          if (label) {
            label.style.transform =
              `translate(${row.x.toFixed(1)}px, ${row.y.toFixed(1)}px) ` +
              `translate(${row.left ? "0" : "-100"}%, -50%)`;
            label.style.opacity = (alpha * (0.62 + 0.38 * on)).toFixed(3);
            label.dataset.on = on > 0.5 ? "true" : "false";
            label.dataset.side = row.left ? "left" : "right";
          }

          // Out of the label, a short level run, then straight at the sheet.
          // With the anchor solved to the row's own height that second leg is
          // level too, most of the time: a rule from a name to the layer it
          // names, which is what the flat sections on this site draw.
          const from = row.left ? row.x + labelWidth(label) : row.x - labelWidth(label);
          const shoulder = row.left ? from + SHOULDER : from - SHOULDER;
          const leader = leaders.current[i];
          if (leader) {
            leader.dataset.on = on > 0.5 ? "true" : "false";
            leader.style.opacity = alpha.toFixed(3);
            leader.setAttribute(
              "d",
              `M${from.toFixed(1)} ${row.y.toFixed(1)}H${shoulder.toFixed(1)}L${row.ax.toFixed(1)} ${row.ay.toFixed(1)}`,
            );
          }
          const dot = dots.current[i];
          if (dot) {
            dot.style.opacity = alpha.toFixed(3);
            dot.setAttribute("cx", row.ax.toFixed(1));
            dot.setAttribute("cy", row.ay.toFixed(1));
          }
        }
      },
    }),
    [camera],
  );

  return (
    <div ref={root} className="stack-callouts" aria-hidden="true">
      <svg className="stack-leaders" focusable="false">
        <g ref={origin} className="stack-leaders-origin">
          {construction.layers.map((layer, i) => (
            <g key={layer.id}>
              <path
                ref={(el) => {
                  leaders.current[i] = el;
                }}
                className="stack-leader"
                d="M0 0"
              />
              <circle
                ref={(el) => {
                  dots.current[i] = el;
                }}
                className="stack-anchor-dot"
                r="2"
                cx="0"
                cy="0"
              />
            </g>
          ))}
        </g>
      </svg>

      {construction.layers.map((layer, i) => (
        <div
          key={layer.id}
          ref={(el) => {
            labels.current[i] = el;
          }}
          className="stack-callout"
          onMouseEnter={() => onHover(i)}
          onMouseLeave={() => onHover(null)}
        >
          <span className="stack-callout-n">{String(i + 1).padStart(2, "0")}</span>
          <span className="stack-callout-body">
            <span className="stack-callout-name">{layer.name}</span>
            <span className="stack-callout-mm">
              {layer.thicknessMm > 0 ? `${layer.thicknessMm} mm` : "—"}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * A point on the line down a sheet's visible strip, at a given height.
 *
 * The line is the whole of a leader's freedom: it may land anywhere down its
 * own sheet, in the strip of it that is showing, and nowhere else. Everything
 * the layout does is choosing where on this line to stop.
 */
function at(
  line: { top: { x: number; y: number }; bottom: { x: number; y: number } },
  y: number,
): { x: number; y: number } {
  const drop = line.bottom.y - line.top.y;
  const v = Math.abs(drop) < 1 ? 0.5 : clamp((y - line.top.y) / drop, REACH, 1 - REACH);
  return { x: mix(line.top.x, line.bottom.x, v), y: mix(line.top.y, line.bottom.y, v) };
}

/**
 * How wide a label is, so the leader can start at its inner edge rather than
 * from under the middle of the words.
 *
 * Read off the node and cached on it: the labels are static text at a fixed
 * size, so this measures once per label per resize rather than once a frame.
 */
function labelWidth(label: HTMLDivElement | null | undefined): number {
  if (!label) return 0;
  const cached = label.dataset.w;
  if (cached) return Number(cached);
  const w = label.offsetWidth;
  if (w > 0) label.dataset.w = String(w);
  return w;
}
