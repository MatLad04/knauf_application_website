"use client";

import { useEffect, useState } from "react";

/**
 * The ground of the loading screen: a self-healing cutting mat, which is the
 * one piece of equipment on every drawing-office and workshop bench in this
 * trade. Ruled field, ruler bands with numbered ticks, the 30/45/60 guides
 * struck from the origin, and the printed label block a mat carries on its
 * right-hand side.
 *
 * It is not a picture that sits there: it is *printed* as the page loads. The
 * progress the loader is reporting is the progress of the printing — the field
 * is ruled left to right, the guides are then struck from the corner, and the
 * label sets line by line. At 100% the mat is complete, which is the only
 * honest thing a loading screen can draw.
 *
 * Everything is derived from one number, so nothing here animates on a timer of
 * its own and nothing can finish before the page does.
 *
 * The sheet is cut to the screen rather than the screen cropped to the sheet.
 * A fixed drawing can only be letterboxed or sliced, and both were wrong: the
 * slice took the label block's edge off a laptop and left a phone with two
 * stray guides and a ruler numbered from seven, and the fit left the mat as a
 * postage stamp in a field of blue. So the mat has no fixed size — it is drawn
 * to whatever proportion the screen has, with a cell that stays the same size
 * on every one of them and the number of cells doing the changing. Portrait
 * screens get a portrait mat, and the label block moves to the foot of the
 * sheet, or off it entirely, according to what there is room for.
 */

/** The mat, in its own units, for the screen it has to cover. */
export type Sheet = {
  /** The sheet, in user units, at the screen's own proportion. */
  w: number;
  h: number;
  /** The ruler band: the margin between the trim and the ruled field. */
  m: number;
  /** Where the printed label block goes, if there is room for it at all. */
  note: "side" | "foot" | null;
};

/** A landscape sheet, for the frame before the screen has been measured. */
const DEFAULT_SHEET: Sheet = { w: 1108, h: 692, m: 60, note: "side" };

/**
 * The sheet the screen asks for.
 *
 * One cell is the constant: a mat is read at the size its squares are, so the
 * cell is held at roughly the same number of pixels everywhere and the sheet
 * takes as many of them as it needs. On a small screen the cell comes down —
 * seventy-eight pixels of grid on a phone is three squares and no drawing.
 */
export function useSheet(): Sheet {
  const [sheet, setSheet] = useState<Sheet>(DEFAULT_SHEET);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const short = Math.min(vw, vh);

      // One cell, in pixels, and the units-per-pixel that follow from it.
      const cell = Math.min(78, Math.max(52, short / 11));
      const k = 60 / cell;

      const w = Math.round(vw * k);
      const h = Math.round(vh * k);
      const m = short < 520 ? 40 : 60;
      const fw = w - 2 * m;
      const fh = h - 2 * m;

      // The block is printed where it can be read: down the right-hand side of
      // a landscape sheet, along the foot of a tall one, and on neither when
      // the sheet is a phone — there it is set as type under the mat instead.
      const note: Sheet["note"] =
        fw >= 690 && fh >= 520 ? "side" : fw >= 520 && fh >= 900 ? "foot" : null;

      setSheet((prev) =>
        prev.w === w && prev.h === h && prev.m === m && prev.note === note
          ? prev
          : { w, h, m, note },
      );
    };

    measure();

    const onResize = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return sheet;
}

/**
 * `progress` is the whole input: 0 → nothing printed, 1 → the whole mat, and
 * the figure the reader watches is that same number as a percentage. `enter`
 * opens the way in, which is drawn into the label block rather than floated
 * over it, so the one thing to press is part of the sheet it is printed on.
 */
type Props = {
  progress: number;
  sheet: Sheet;
  enter?: boolean;
  onEnter?: () => void;
  className?: string;
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Cubic ease-out, so each pass slows as it completes rather than stopping. */
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);

/** The share of `progress` between `from` and `to`, eased. */
const between = (p: number, from: number, to: number) => ease((p - from) / (to - from));

const MANIFESTO = [
  "74 insulation, reinforcement and ",
  "render products, carrying the values a",
  "European datasheet actually carries.",
  "",
  "λD in W/(m·K). Reaction to fire as a",
  "Euroclass. Depth in mm.",
  "Every one of them is a filter",
  "",
  "The catalogue is a prototype.",
  "The framework around it is not.",
];

/** The three guides a mat is struck with, and the one that is dashed. */
const GUIDES = [
  { deg: 60, dashed: false },
  { deg: 45, dashed: false },
  { deg: 30, dashed: true },
];

export default function CuttingMat({
  progress,
  sheet,
  enter = false,
  onEnter,
  className = "",
}: Props) {
  const p = clamp(progress);
  const percent = Math.round(p * 100);

  // Three passes, overlapping: the field, the guides struck over it, the label
  // set last — the order a mat is actually printed in.
  const field = between(p, 0, 0.55);
  const guides = between(p, 0.4, 0.86);
  const label = clamp((p - 0.6) / 0.34);

  const { w: W, h: H, m: M, note } = sheet;

  // Where the field starts and ends, inside the ruler bands.
  const L = M;
  const T = M;
  const R = W - M;
  const B = H - M;

  /* The cell is nominally 60 units, and the field is ruled with as many whole
     cells as fit: the last column of a mat is never a sliver. Heavy every
     fifth line, which is the 300 a fixed sheet used to say. */
  const cols = Math.max(4, Math.round((R - L) / 60));
  const rows = Math.max(4, Math.round((B - T) / 60));
  const stepX = (R - L) / cols;
  const stepY = (B - T) / rows;

  const verticals = Array.from({ length: cols + 1 }, (_, i) => ({ x: L + i * stepX, i }));
  const horizontals = Array.from({ length: rows + 1 }, (_, j) => ({ y: T + j * stepY, j }));
  const heavy = (i: number) => i % 5 === 0;

  /* Each guide is struck from the origin and stopped where it leaves the
     field, so a portrait sheet takes them out through the head and a wide one
     out through the side, without either being drawn twice. */
  const ray = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    const t = Math.min((R - L) / Math.cos(a), (B - T) / Math.sin(a));
    return { a, t, x: L + t * Math.cos(a), y: B - t * Math.sin(a) };
  };

  const rays = GUIDES.map((guide) => ({ ...guide, ...ray(guide.deg) }));
  const arc = Math.min(R - L, B - T);

  /* The label block. Down the side of a landscape sheet, along the foot of a
     tall one — a title block goes where the drawing leaves room, which on a
     portrait sheet is the bottom of it. The block is set from its own foot in
     both cases, because the way in is the last cell it carries and the reader
     should find it in the same place either way. */
  const noteBottom = B - 26;
  const NOTE_W = note === "foot" ? Math.min(R - L - 60, 620) : 380;
  const NOTE_X = note === "foot" ? L + 30 : R - 30 - NOTE_W;
  const NOTE_Y = note === "foot" ? noteBottom - 486 : T + 60;
  const NOTE_H = noteBottom - (NOTE_Y - 34);
  const FOOT_Y = noteBottom - 70;

  /* The caution and its code strip sit in the band the manifesto leaves above
     the rule that closes the block, centred in it rather than hung under the
     last line — a title block sets its caution in the space it has. Derived
     from the two edges rather than typed, so adding a line to the manifesto
     moves it. */
  const manifestoFoot = NOTE_Y + 76 + (MANIFESTO.length - 1) * 24 + 5;
  const blockRuleY = FOOT_Y - 28;
  const cautionY = Math.round((manifestoFoot + blockRuleY - 30) / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className}>
      <defs>
        {/* The printing pass: the field is ruled left to right. */}
        <clipPath id="mat-print">
          <rect x="0" y="0" width={W * field} height={H} />
        </clipPath>

        {/* The guides are struck from the origin, so they are revealed from it:
            one growing radius, and every line and arc comes out of the corner
            together at the rate the rest of the mat is printing. */}
        <clipPath id="mat-strike">
          <circle cx={L} cy={B} r={Math.hypot(R - L, B - T) * guides} />
        </clipPath>
      </defs>

      <g clipPath="url(#mat-print)" fill="none" stroke="currentColor">
        {/* The field. */}
        <g strokeWidth="0.7" opacity="0.34">
          {verticals.map(({ x, i }) => (
            <path key={`v${i}`} d={`M${x} ${T}V${B}`} />
          ))}
          {horizontals.map(({ y, j }) => (
            <path key={`h${j}`} d={`M${L} ${y}H${R}`} />
          ))}
        </g>

        <g strokeWidth="1.1" opacity="0.6">
          {verticals
            .filter(({ i }) => heavy(i))
            .map(({ x, i }) => (
              <path key={`V${i}`} d={`M${x} ${T}V${B}`} />
            ))}
          {horizontals
            .filter(({ j }) => heavy(j))
            .map(({ y, j }) => (
              <path key={`H${j}`} d={`M${L} ${y}H${R}`} />
            ))}
        </g>

        {/* The ruler bands, and the double border a mat is trimmed with. */}
        <g strokeWidth="1.3" opacity="0.85">
          <rect x="22" y="22" width={W - 44} height={H - 44} />
          <rect x={L} y={T} width={R - L} height={B - T} strokeWidth="1.6" />
        </g>

        <g strokeWidth="1.2" opacity="0.8">
          {verticals.map(({ x, i }) => (
            <path key={`tt${i}`} d={`M${x} ${T}v${heavy(i) ? -20 : -10}`} />
          ))}
          {verticals.map(({ x, i }) => (
            <path key={`bt${i}`} d={`M${x} ${B}v${heavy(i) ? 20 : 10}`} />
          ))}
          {horizontals.map(({ y, j }) => (
            <path key={`lt${j}`} d={`M${L} ${y}h${heavy(j) ? -20 : -10}`} />
          ))}
          {horizontals.map(({ y, j }) => (
            <path key={`rt${j}`} d={`M${R} ${y}h${heavy(j) ? 20 : 10}`} />
          ))}
        </g>

        <g
          fill="currentColor"
          stroke="none"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.5"
          opacity="0.62"
        >
          {verticals.slice(1, -1).map(({ x, i }) => (
            <text key={`vn${i}`} x={x + 5} y={T - 8}>
              {i}
            </text>
          ))}
          {horizontals.slice(1, -1).map(({ y, j }) => (
            <text key={`hn${j}`} x={L - 30} y={y + 4}>
              {j}
            </text>
          ))}
        </g>
      </g>

      {/* The guides, struck from the origin in the bottom-left corner the way a
          mat prints them. */}
      <g
        clipPath="url(#mat-strike)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.9"
      >
        {rays.map(({ deg, dashed, x, y }) => (
          <path
            key={deg}
            d={`M${L} ${B}L${x} ${y}`}
            strokeDasharray={dashed ? "12 9" : undefined}
          />
        ))}
        <path
          d={`M${L + arc * 0.34} ${B}A${arc * 0.34} ${arc * 0.34} 0 0 1 ${L} ${B - arc * 0.34}`}
          opacity="0.7"
        />
        <path
          d={`M${L + arc * 0.52} ${B}A${arc * 0.52} ${arc * 0.52} 0 0 1 ${L} ${B - arc * 0.52}`}
          opacity="0.45"
        />
      </g>

      <g
        fill="currentColor"
        fontFamily="var(--font-mono)"
        fontSize="15"
        letterSpacing="1.5"
        textAnchor="middle"
        opacity={0.9 * clamp((p - 0.72) / 0.12)}
      >
        {rays.map(({ deg, a, t }) => {
          const x = L + t * 0.46 * Math.cos(a);
          const y = B - t * 0.46 * Math.sin(a);
          return (
            <text key={deg} x={x} y={y} dy="-7" transform={`rotate(${-deg} ${x} ${y})`}>
              {deg}&#176;
            </text>
          );
        })}
      </g>

      {/* The printed label. A mat carries its manufacturer, what it is, and the
          small print you are supposed to have read; so does this.

          Down the side of a wide sheet the panel sits on empty field and can be
          a shade short of opaque, the way a label printed on a mat is. Along the
          foot of a tall one it lies across the guides, and a drawing showing
          through a title block is a printing fault, so there it is solid. */}
      {note && (
        <g className="mat-note">
          <rect
            x={NOTE_X - 24}
            y={NOTE_Y - 34}
            width={NOTE_W + 48}
            height={NOTE_H}
            rx="2"
            fill="#0d2049"
            opacity={(note === "foot" ? 1 : 0.94) * clamp(label / 0.12)}
          />
          <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.5">
            <rect
              x={NOTE_X - 24}
              y={NOTE_Y - 34}
              width={NOTE_W + 48}
              height={NOTE_H}
              rx="2"
              pathLength={1}
              strokeDasharray={`${ease(label)} 1`}
            />
          </g>

          <g fill="currentColor">
            <text
              x={NOTE_X}
              y={NOTE_Y}
              fontFamily="var(--font-display)"
              fontSize="30"
              fontWeight="700"
              letterSpacing="1"
              opacity={clamp((label - 0.04) / 0.08)}
            >
              KERNBAU
            </text>
            <text
              x={NOTE_X}
              y={NOTE_Y + 24}
              fontFamily="var(--font-mono)"
              fontSize="13"
              letterSpacing="2.6"
              opacity={0.72 * clamp((label - 0.12) / 0.08)}
            >
              PRODUCT CATALOGUE &#183; PROTOTYPE
            </text>

            <path
              d={`M${NOTE_X} ${NOTE_Y + 42}h${NOTE_W}`}
              stroke="currentColor"
              strokeWidth="1.2"
              opacity={0.55 * clamp((label - 0.18) / 0.06)}
            />

            {MANIFESTO.map((line, i) => (
              <text
                key={i}
                x={NOTE_X}
                y={NOTE_Y + 76 + i * 24}
                fontFamily="var(--font-mono)"
                fontSize="14.5"
                opacity={0.86 * clamp((label - (0.24 + i * 0.05)) / 0.05)}
              >
                {line}
              </text>
            ))}

            {/* The caution line every mat ends on, and the one this catalogue
                actually needs. */}
            <g opacity={clamp((label - 0.82) / 0.1)}>
              {/* No box. The caution is printed on the mat, not stamped onto
                  it: the words carry it, and a rule around them made it the
                  loudest cell on a block whose loudest cell should be the way
                  in. */}
              <text
                x={NOTE_X}
                y={cautionY + 21}
                fontFamily="var(--font-mono)"
                fontSize="14"
                letterSpacing="1.6"
                opacity="0.95"
              >
                NOT FOR CONSTRUCTION
              </text>

              {/* The code strip, in the corner a mat prints one. */}
              <g stroke="currentColor" strokeWidth="2" opacity="0.7">
                {[0, 5, 9, 16, 20, 22, 29, 34, 38, 45, 49, 56, 60, 64, 71, 75].map((d, i) => (
                  <path
                    key={i}
                    d={`M${NOTE_X + NOTE_W - 118 + d} ${cautionY + 2}v26`}
                    strokeWidth={i % 3 === 0 ? 3 : 1.4}
                  />
                ))}
              </g>
            </g>

            {/* The foot of the block: the state of the printing, in the two
                cells a title block would carry it in — the way in on the left,
                and the figure it is waiting on ranged right against the same
                edge every other line on the block ends at. */}
            <path
              d={`M${NOTE_X} ${blockRuleY}h${NOTE_W}`}
              stroke="currentColor"
              strokeWidth="1.2"
              opacity={0.55 * clamp((label - 0.86) / 0.08)}
            />

            <g
              className="mat-enter"
              data-ready={enter ? "true" : undefined}
              role="button"
              tabIndex={enter ? 0 : -1}
              aria-label="Enter the catalogue"
              onClick={enter ? onEnter : undefined}
              onKeyDown={(event) => {
                if (!enter || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                onEnter?.();
              }}
            >
              <rect
                x={NOTE_X}
                y={FOOT_Y}
                width="238"
                height="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <text
                x={NOTE_X + 119}
                y={FOOT_Y + 29}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="14"
                letterSpacing="1.6"
              >
                ENTER THE CATALOGUE
              </text>
            </g>

            {/* The number the whole drawing is made of, set on the block rather
                than in the corner of the screen: it is the first thing printed
                and the last thing to finish. */}
            <text
              className="mat-figure"
              x={NOTE_X + NOTE_W}
              y={FOOT_Y + 38}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="46"
              opacity={clamp(p / 0.04)}
            >
              {percent}
              <tspan fontSize="20" dx="3" opacity="0.7">
                %
              </tspan>
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
