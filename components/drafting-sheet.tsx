"use client";

import { useState } from "react";

/**
 * The first screen, drawn rather than photographed.
 *
 * A photograph of a wall says "marketing". The same wall in section, at scale,
 * with every layer dimensioned and called out, says what this catalogue is for:
 * a specifier does not buy a board, they buy 366 millimetres of wall with a
 * declared U-value and a fire class, and this is what that looks like on paper.
 *
 * The device that carries it is the detail balloon. Four of the seven layers
 * are between 1 and 8 mm — at the scale the wall has to be drawn at they are
 * hairlines, which is exactly the problem a real detail solves by taking a
 * circle out of the drawing and enlarging it. So the skin is drawn twice: once
 * in place, and once at four times the size in a balloon beside it, with the
 * leader between them. It is the most characteristic thing in the trade's own
 * drawing language and it is the argument of the site in one figure.
 *
 * Inline SVG rather than an asset: every line takes its colour from the theme
 * tokens, so it inverts with the rest of the site instead of being two files.
 * It is decorative — the headline beside it carries the meaning — so it is
 * hidden from assistive technology. The paper it sits on is ruled in CSS by
 * `.sheet` rather than drawn here, so the drawing can be fitted rather than
 * cropped.
 *
 * The section and the list of callouts beside it are the same six layers said
 * twice, so pointing at either says it in the other: the band lights and its
 * name lights with it, whichever of the two the pointer is over.
 */

/** The build-up, innermost first, at the depths the catalogue declares. */
const LAYERS = [
  { name: "Substrate", note: "Blockwork", mm: 200, fill: "coarse" },
  { name: "Adhesive", note: "KB-AD-110", mm: 10, fill: "mortar" },
  { name: "Insulation", note: "KB-MW-035-140", mm: 140, fill: "fibre" },
  { name: "Base coat", note: "KB-BC-140", mm: 6, fill: "mortar" },
  { name: "Mesh", note: "KB-RM-165", mm: 2, fill: "mesh" },
  { name: "Render", note: "KB-RF-015", mm: 8, fill: "stipple" },
] as const;

const FILLS: Record<string, string> = {
  coarse: "url(#ds-coarse-fill)",
  fibre: "url(#ds-fibre)",
  mesh: "url(#ds-mesh)",
  stipple: "url(#ds-stipple)",
  mortar: "url(#ds-mortar)",
};

/* Drawing units per millimetre, and where the stack sits in the viewBox. */
const SCALE = 1.285;
const TOP = 96;
const LEFT = 160;
const WIDTH = 360;
/** Where the leaders turn and the label column begins. */
const LABEL_X = 606;

/** The detail balloon: what it is centred on, and where it is drawn. */
const DETAIL_MAG = 4;
const BALLOON_X = 344;
const BALLOON_Y = 722;
const BALLOON_R = 86;

export default function DraftingSheet({ className = "" }: { className?: string }) {
  const [hot, setHot] = useState<string | null>(null);

  let cursor = TOP;
  const bands = LAYERS.map((layer) => {
    const height = layer.mm * SCALE;
    const band = { ...layer, y: cursor, height };
    cursor += height;
    return band;
  });

  const bottom = cursor;
  const right = LEFT + WIDTH;
  const totalMm = LAYERS.reduce((sum, layer) => sum + layer.mm, 0);

  // The skin: everything outboard of the insulation, which is what the balloon
  // enlarges. Four layers, sixteen millimetres, and unreadable at wall scale.
  const skin = bands.slice(3);
  const skinTop = skin[0]!.y;
  const skinMm = skin.reduce((sum, band) => sum + band.mm, 0);
  const markY = skinTop + (bottom - skinTop) / 2;

  // Labels are spread evenly down the column: a 2 mm layer and a 200 mm layer
  // need the same room for their name, which is the whole reason for the jog.
  const step = (bottom - TOP - 28) / (bands.length - 1);

  return (
    <svg
      viewBox="0 0 1000 900"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* Hatches, one per material, the way a section is filled by hand. */}
        <pattern
          id="ds-fibre"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <path d="M0 3.5h7" stroke="currentColor" strokeWidth="0.8" opacity="0.75" />
        </pattern>
        <pattern id="ds-coarse-fill" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="5" r="1.9" fill="currentColor" opacity="0.5" />
          <circle cx="13" cy="11" r="2.7" fill="currentColor" opacity="0.42" />
          <circle cx="8" cy="14" r="1.2" fill="currentColor" opacity="0.46" />
          <circle cx="15" cy="3" r="1" fill="currentColor" opacity="0.46" />
        </pattern>
        <pattern id="ds-mesh" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M5 0H0V5" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.9" />
        </pattern>
        <pattern id="ds-stipple" width="4.5" height="4.5" patternUnits="userSpaceOnUse">
          <circle cx="2.2" cy="2.2" r="0.7" fill="currentColor" opacity="0.8" />
        </pattern>
        <pattern id="ds-mortar" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="0.6" fill="currentColor" opacity="0.7" />
          <circle cx="4.4" cy="4.4" r="0.5" fill="currentColor" opacity="0.7" />
        </pattern>

        <clipPath id="ds-balloon">
          <circle cx={BALLOON_X} cy={BALLOON_Y} r={BALLOON_R - 1} />
        </clipPath>
      </defs>

      <g className="sheet-section" data-hot={hot ?? undefined}>
        {/* The cut. Each layer at its declared depth, so the drawing is to
            scale against itself and the insulation is visibly the wall.

            The hit area is a second, transparent rect: a 2 mm layer is two
            pixels of drawing and nothing can be pointed at that reliably, so
            every band answers to a target at least eleven units deep. */}
        <g className="ds-band">
          {bands.map((band) => (
            <rect
              key={band.name}
              data-layer={band.name}
              x={LEFT}
              y={band.y}
              width={WIDTH}
              height={band.height}
              fill={FILLS[band.fill]}
              stroke="currentColor"
              strokeWidth="1.1"
            />
          ))}
        </g>

        <g className="ds-hit">
          {bands.map((band) => (
            <rect
              key={`hit-${band.name}`}
              x={LEFT}
              y={band.y + band.height / 2 - Math.max(band.height, 11) / 2}
              width={WIDTH}
              height={Math.max(band.height, 11)}
              fill="transparent"
              onMouseEnter={() => setHot(band.name)}
              onMouseLeave={() => setHot(null)}
            />
          ))}
        </g>

        {/* The break line. The substrate carries on into the building, and a
            section that stops at a tidy edge is claiming it does not. */}
        <path
          d={`M${LEFT} ${TOP}${Array.from({ length: 9 }, (_, i) => `l${WIDTH / 18} ${i % 2 ? 9 : -9}`).join("")}`}
          fill="var(--color-surface)"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.85"
        />

        {/* Which side is which. The whole of building physics is downstream of
            this one distinction, and it costs two words. */}
        <g
          fill="currentColor"
          fontFamily="var(--font-mono)"
          fontSize="14.5"
          letterSpacing="2"
          opacity="0.78"
        >
          <text x={LEFT + 10} y={TOP - 22}>
            INSIDE
          </text>
          <text x={LEFT + 10} y={bottom + 30}>
            OUTSIDE
          </text>
        </g>

        {/* Leaders out to the label column. */}
        <g className="ds-leader">
          {bands.map((band, i) => {
            const mid = band.y + band.height / 2;
            const labelY = TOP + 14 + i * step;
            return (
              <g
                key={`${band.name}-label`}
                data-layer={band.name}
                onMouseEnter={() => setHot(band.name)}
                onMouseLeave={() => setHot(null)}
              >
                <rect x={LABEL_X + 24} y={labelY - 24} width={330} height={44} fill="transparent" />
                <path
                  d={`M${right} ${mid}H${LABEL_X - 52}L${LABEL_X} ${labelY}h22`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.85"
                />
                <circle cx={right} cy={mid} r="2.8" fill="currentColor" opacity="1" />
                <text
                  x={LABEL_X + 32}
                  y={labelY - 5}
                  fill="currentColor"
                  fontFamily="var(--font-mono)"
                  fontSize="16.5"
                  letterSpacing="1.4"
                  opacity="1"
                >
                  {band.name.toUpperCase()}
                </text>
                <text
                  x={LABEL_X + 32}
                  y={labelY + 15}
                  fill="currentColor"
                  fontFamily="var(--font-mono)"
                  fontSize="13.5"
                  letterSpacing="0.4"
                  opacity="0.75"
                >
                  {band.mm} mm · {band.note}
                </text>
              </g>
            );
          })}
        </g>

        {/* The dimension string: every layer ticked off down the left, and the
            overall depth outboard of it. This is the figure a specifier is
            actually asked for, and it belongs to the wall rather than to any
            product in it. */}
        <g className="ds-dim" opacity="1">
          <path
            d={`M${LEFT - 44} ${TOP}V${bottom}`}
            stroke="currentColor"
            strokeWidth="0.9"
            fill="none"
          />
          {bands.map((band) => (
            <path
              key={`tick-${band.name}`}
              d={`M${LEFT - 51} ${band.y + 5}l14 -10`}
              stroke="currentColor"
              strokeWidth="0.9"
              fill="none"
            />
          ))}
          <path
            d={`M${LEFT - 51} ${bottom + 5}l14 -10`}
            stroke="currentColor"
            strokeWidth="0.9"
            fill="none"
          />

          <path
            d={`M${LEFT - 84} ${TOP}V${bottom}M${LEFT - 92} ${TOP}h16M${LEFT - 92} ${bottom}h16`}
            stroke="currentColor"
            strokeWidth="0.9"
            fill="none"
          />
          <text
            x={LEFT - 96}
            y={(TOP + bottom) / 2}
            fill="currentColor"
            fontFamily="var(--font-mono)"
            fontSize="16.5"
            letterSpacing="1"
            textAnchor="middle"
            transform={`rotate(-90 ${LEFT - 96} ${(TOP + bottom) / 2})`}
          >
            {totalMm} mm overall
          </text>
        </g>

        {/* The detail balloon. The four outer layers are 16 mm between them —
            hairlines at the scale the wall has to be drawn at — so they are
            taken out in a circle and drawn again at four times the size, which
            is what the trade does with exactly this problem. */}
        <g className="ds-detail">
          <circle
            cx={right - 46}
            cy={markY}
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.75"
          />
          <path
            d={`M${right - 62} ${markY + 40}L${BALLOON_X + 74} ${BALLOON_Y - BALLOON_R + 26}`}
            stroke="currentColor"
            strokeWidth="0.9"
            fill="none"
            opacity="0.5"
          />

          <circle
            cx={BALLOON_X}
            cy={BALLOON_Y}
            r={BALLOON_R}
            fill="var(--color-surface)"
            opacity="0.55"
          />

          <g clipPath="url(#ds-balloon)">
            {/* The same layers, same fills, four times the size — drawn from
                the real geometry, so the enlargement cannot drift from the
                wall it is taken out of. */}
            {[bands[2]!, ...skin].map((band) => {
              const h = band.height * DETAIL_MAG;
              const y =
                BALLOON_Y - ((skinTop - band.y) * DETAIL_MAG + (skinMm * SCALE * DETAIL_MAG) / 2);
              return (
                <rect
                  key={`det-${band.name}`}
                  x={BALLOON_X - BALLOON_R}
                  y={y}
                  width={BALLOON_R * 2}
                  height={h}
                  fill={FILLS[band.fill]}
                  stroke="currentColor"
                  strokeWidth="1.1"
                />
              );
            })}
          </g>

          <circle
            cx={BALLOON_X}
            cy={BALLOON_Y}
            r={BALLOON_R}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.85"
          />

          {/* What the balloon is of, stated the way a drawing states it. */}
          <g fill="currentColor" fontFamily="var(--font-mono)" letterSpacing="1.4">
            <text x={BALLOON_X} y={BALLOON_Y + BALLOON_R + 28} fontSize="15.5" textAnchor="middle">
              DET. A · SKIN AT 4:1
            </text>
            <text
              x={BALLOON_X}
              y={BALLOON_Y + BALLOON_R + 48}
              fontSize="13.5"
              textAnchor="middle"
              opacity="0.75"
            >
              {skinMm} mm over the board
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
