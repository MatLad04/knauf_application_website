"use client";

import type { Layer } from "@/lib/build-up";
import HatchDefs, { hatchFor } from "./hatch-defs";

/**
 * The specimen: a section through the configured wall, drawn upward from the
 * substrate the way it is built — inside at the foot of the sheet, outside at
 * the head. Every band is at its true depth against every other one, which is
 * the only claim the drawing makes and the one a photograph cannot.
 *
 * It moves rather than redraws. Everything with a geometry that changes is a
 * `<rect>`, because `y` and `height` are animatable CSS properties on one and
 * `d` is not on a path: choose a deeper board and the bands above it slide up
 * and the board grows into the gap, instead of the whole drawing being replaced
 * under the cursor. A browser that does not animate SVG geometry simply
 * redraws, which is the same wall a beat sooner.
 *
 * The layers are named in the legend beneath rather than on leader lines out of
 * the drawing. A leader joins two points that both move, so it can only ever
 * jump; a legend in installation order, keyed by the same hatch, says the same
 * thing and can follow.
 */

const W = 250;
const H = 400;
const LEFT = 74;
const RIGHT = 204;
const TOP = 26;
const BOTTOM = 374;

/**
 * How far the anchor is set into the substrate. Not a free number: the
 * catalogue sells it at 95 mm for a 60 mm board and 175 mm for a 140 mm one,
 * and both leave exactly this much past the adhesive.
 */
const EMBEDMENT_MM = 25;

type Band = Layer & { y: number; height: number };

export default function WallSection({
  layers,
  totalMm,
  hot = null,
  onHover,
}: {
  layers: Layer[];
  totalMm: number;
  /** The id of the layer being pointed at, in the drawing or in the legend. */
  hot?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const drawn = layers.filter((layer) => layer.mm > 0 && layer.hatch !== null);
  const scale = (BOTTOM - TOP) / totalMm;

  let cursor = BOTTOM;
  const bands: Band[] = drawn.map((layer) => {
    const height = layer.mm * scale;
    cursor -= height;
    return { ...layer, y: cursor, height };
  });

  const board = bands.find((band) => band.isBoard);
  const substrate = bands.find((band) => band.id === "substrate");

  // The anchor is driven through everything the system adds and this far into
  // what was already there, so both ends of it move when the board does.
  const face = board?.y ?? TOP;
  const tip = (substrate?.y ?? BOTTOM) + EMBEDMENT_MM * scale;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="specimen"
      role="img"
      aria-label={`Section through the build-up: ${Math.round(totalMm)} millimetres overall, with a ${board?.mm ?? 0} millimetre insulation board.`}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      data-hot={hot ?? undefined}
    >
      <HatchDefs />

      <g
        className="specimen-side"
        fill="var(--color-muted)"
        fontFamily="var(--font-mono)"
        fontSize="8"
        letterSpacing="1.4"
      >
        <text x={LEFT} y={TOP - 9}>
          OUTSIDE
        </text>
        <text x={LEFT} y={BOTTOM + 15}>
          INSIDE
        </text>
      </g>

      {/* The wall. One rect per layer, at its declared depth.

          Each band is also the thing you point at. The schedule beside the
          drawing and the drawing itself are the same layers said twice, so
          pointing at either one says it in the other — which is the only cheap
          way to answer the question a list of layers always raises: *which* of
          these is the 2 mm one. A band 1 px tall is unpointable, so every band
          carries a hit area at least this deep over the top of it. */}
      {bands.map((band) => (
        <g
          key={band.id}
          data-band={band.id}
          data-hot={hot === band.id ? "true" : undefined}
          className="band-group"
          onMouseEnter={onHover ? () => onHover(band.id) : undefined}
        >
          <rect
            className="band"
            x={LEFT}
            y={band.y}
            width={RIGHT - LEFT}
            height={band.height}
            style={{ y: `${band.y}px`, height: `${band.height}px` }}
            fill={`url(#${hatchFor(band.hatch!)})`}
            stroke="var(--color-edge)"
            strokeWidth="1"
          />
          <rect
            className="band-hit"
            x={LEFT}
            y={band.y + band.height / 2 - Math.max(band.height, 7) / 2}
            width={RIGHT - LEFT}
            height={Math.max(band.height, 7)}
            fill="transparent"
          />
        </g>
      ))}

      {/* The anchor. Two rects rather than a path, so it can follow the board
          it is sold to suit. */}
      {board && (
        <g className="specimen-anchor">
          <rect
            className="band"
            x={LEFT + 30}
            y={face}
            width={2}
            height={Math.max(0, tip - face)}
            style={{ y: `${face}px`, height: `${Math.max(0, tip - face)}px` }}
          />
          <rect
            className="band"
            x={LEFT + 16}
            y={face - 1}
            width={30}
            height={3}
            style={{ y: `${face - 1}px` }}
          />
        </g>
      )}

      {/* Overall depth down the left. Fixed: the drawing is always this tall,
          and it is the figure beside it that changes. */}
      <g className="specimen-dim">
        <rect x={LEFT - 26} y={TOP} width={1} height={BOTTOM - TOP} />
        <rect x={LEFT - 30} y={TOP} width={9} height={1} />
        <rect x={LEFT - 30} y={BOTTOM - 1} width={9} height={1} />
      </g>
      <text
        className="specimen-total"
        x={LEFT - 34}
        y={(TOP + BOTTOM) / 2}
        textAnchor="middle"
        transform={`rotate(-90 ${LEFT - 34} ${(TOP + BOTTOM) / 2})`}
      >
        {Math.round(totalMm)} mm overall
      </text>

      {/* The board's own depth, in the one colour on the site that means "this
          is the thing you are moving". */}
      {board && (
        <>
          <rect
            className="band specimen-board-bar"
            x={RIGHT + 10}
            y={board.y}
            width={3}
            height={board.height}
            style={{ y: `${board.y}px`, height: `${board.height}px` }}
          />
          <g
            className="specimen-board-figure"
            style={{ transform: `translateY(${board.y + board.height / 2}px)` }}
          >
            <text x={RIGHT + 20} y="3">
              {board.mm}
            </text>
            <text className="specimen-board-unit" x={RIGHT + 20} y="13">
              mm
            </text>
          </g>
        </>
      )}
    </svg>
  );
}
