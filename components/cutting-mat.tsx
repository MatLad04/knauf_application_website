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
 */

/**
 * `progress` is the whole input: 0 → nothing printed, 1 → the whole mat, and
 * the figure the reader watches is that same number as a percentage. `enter`
 * opens the way in, which is drawn into the label block rather than floated
 * over it, so the one thing to press is part of the sheet it is printed on.
 */
type Props = {
  progress: number;
  enter?: boolean;
  onEnter?: () => void;
  className?: string;
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Cubic ease-out, so each pass slows as it completes rather than stopping. */
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);

/** The share of `progress` between `from` and `to`, eased. */
const between = (p: number, from: number, to: number) => ease((p - from) / (to - from));

/** Where the field starts and ends, inside the ruler bands. */
const L = 60;
const R = 1140;
const T = 60;
const B = 640;

/** The label block: the printed panel a mat carries on its right-hand side. */
const NOTE_X = 730;
const NOTE_Y = 120;
const NOTE_W = 380;
/* The block keeps the same margin at the foot of the field that it keeps at the
   head of it, and the last cell it carries is the state of the printing: the
   way in on the left, the figure it is waiting on at the right. */
const NOTE_H = B - 26 - (NOTE_Y - 34);
const FOOT_Y = NOTE_Y + 424;

const MANIFESTO = [
  "Seventy-four insulation, reinforcement",
  "and render products, declared the way a",
  "European datasheet declares them.",
  "",
  "λD in W/(m·K). Reaction to fire as a",
  "Euroclass. Every value traceable to a",
  "Declaration of Performance.",
  "",
  "The company is invented. The framework",
  "around it is not.",
];

/* The caution and its code strip sit in the band the manifesto leaves above the
   rule that closes the block, centred in it rather than hung under the last
   line — a title block sets its caution in the space it has, and this one was
   crowding the paragraph above it and leaving the gap below. Derived from the
   two edges rather than typed, so adding a line to the manifesto moves it. */
const MANIFESTO_FOOT = NOTE_Y + 76 + (MANIFESTO.length - 1) * 24 + 5;
const BLOCK_RULE_Y = FOOT_Y - 28;
const CAUTION_H = 30;
const CAUTION_Y = Math.round((MANIFESTO_FOOT + BLOCK_RULE_Y - CAUTION_H) / 2);

export default function CuttingMat({ progress, enter = false, onEnter, className = "" }: Props) {
  const p = clamp(progress);
  const percent = Math.round(p * 100);

  // Three passes, overlapping: the field, the guides struck over it, the label
  // set last — the order a mat is actually printed in.
  const field = between(p, 0, 0.55);
  const guides = between(p, 0.4, 0.86);
  const label = clamp((p - 0.6) / 0.34);

  // Verticals every 60, horizontals every 60, heavy every 300.
  const verticals = Array.from({ length: (R - L) / 60 + 1 }, (_, i) => L + i * 60);
  const horizontals = Array.from({ length: (B - T) / 60 + 1 }, (_, i) => T + i * 60);

  return (
    <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" className={className}>
      <defs>
        {/* The printing pass: the field is ruled left to right. */}
        <clipPath id="mat-print">
          <rect x="0" y="0" width={1200 * field} height="700" />
        </clipPath>

        {/* The guides are struck from the origin, so they are revealed from it:
            one growing radius, and every line and arc comes out of the corner
            together at the rate the rest of the mat is printing. */}
        <clipPath id="mat-strike">
          <circle cx={L} cy={B} r={900 * guides} />
        </clipPath>
      </defs>

      <g clipPath="url(#mat-print)" fill="none" stroke="currentColor">
        {/* The field. */}
        <g strokeWidth="0.7" opacity="0.34">
          {verticals.map((x) => (
            <path key={`v${x}`} d={`M${x} ${T}V${B}`} />
          ))}
          {horizontals.map((y) => (
            <path key={`h${y}`} d={`M${L} ${y}H${R}`} />
          ))}
        </g>

        <g strokeWidth="1.1" opacity="0.6">
          {verticals
            .filter((x) => (x - L) % 300 === 0)
            .map((x) => (
              <path key={`V${x}`} d={`M${x} ${T}V${B}`} />
            ))}
          {horizontals
            .filter((y) => (y - T) % 300 === 0)
            .map((y) => (
              <path key={`H${y}`} d={`M${L} ${y}H${R}`} />
            ))}
        </g>

        {/* The ruler bands, and the double border a mat is trimmed with. */}
        <g strokeWidth="1.3" opacity="0.85">
          <rect x="22" y="22" width="1156" height="656" />
          <rect x={L} y={T} width={R - L} height={B - T} strokeWidth="1.6" />
        </g>

        <g strokeWidth="1.2" opacity="0.8">
          {verticals.map((x) => (
            <path key={`tt${x}`} d={`M${x} ${T}v${(x - L) % 300 === 0 ? -20 : -10}`} />
          ))}
          {verticals.map((x) => (
            <path key={`bt${x}`} d={`M${x} ${B}v${(x - L) % 300 === 0 ? 20 : 10}`} />
          ))}
          {horizontals.map((y) => (
            <path key={`lt${y}`} d={`M${L} ${y}h${(y - T) % 300 === 0 ? -20 : -10}`} />
          ))}
          {horizontals.map((y) => (
            <path key={`rt${y}`} d={`M${R} ${y}h${(y - T) % 300 === 0 ? 20 : 10}`} />
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
          {verticals.slice(1, -1).map((x, i) => (
            <text key={`vn${x}`} x={x + 5} y={T - 8}>
              {i + 1}
            </text>
          ))}
          {horizontals.slice(1, -1).map((y, i) => (
            <text key={`hn${y}`} x={L - 30} y={y + 4}>
              {i + 1}
            </text>
          ))}
        </g>
      </g>

      {/* The guides, struck from the origin in the bottom-left corner the way a
          mat prints them. Normalised path lengths, so one number draws them
          all at the same rate whatever their real length. */}
      <g
        clipPath="url(#mat-strike)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.9"
      >
        <path d={`M${L} ${B}L640 60`} />
        <path d={`M${L} ${B}L690 276`} strokeDasharray="12 9" />
        <path d={`M${L} ${B}L394 62`} />
        <path d={`M${L + 200} ${B}A200 200 0 0 1 ${L} ${B - 200}`} opacity="0.7" />
        <path d={`M${L + 300} ${B}A300 300 0 0 1 ${L} ${B - 300}`} opacity="0.45" />
      </g>

      <g
        fill="currentColor"
        fontFamily="var(--font-mono)"
        fontSize="15"
        letterSpacing="1.5"
        opacity={0.9 * clamp((p - 0.72) / 0.12)}
      >
        <text x="252" y="352" transform="rotate(-60 252 352)">
          60&#176;
        </text>
        <text x="319" y="412" transform="rotate(-45 319 412)">
          45&#176;
        </text>
        <text x="433" y="450" transform="rotate(-30 433 450)">
          30&#176;
        </text>
      </g>

      {/* The printed label. A mat carries its manufacturer, what it is, and the
          small print you are supposed to have read; so does this. */}
      <g className="mat-note">
        <rect
          x={NOTE_X - 24}
          y={NOTE_Y - 34}
          width={NOTE_W + 48}
          height={NOTE_H}
          rx="2"
          fill="#0d2049"
          opacity={0.94 * clamp(label / 0.12)}
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
            {/* No box. The caution is printed on the mat, not stamped onto it:
                the words carry it, and a rule around them made it the loudest
                cell on a block whose loudest cell should be the way in. */}
            <text
              x={NOTE_X}
              y={CAUTION_Y + 21}
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
                  d={`M${NOTE_X + 262 + d} ${CAUTION_Y + 2}v26`}
                  strokeWidth={i % 3 === 0 ? 3 : 1.4}
                />
              ))}
            </g>
          </g>

          {/* The foot of the block: the state of the printing, in the two cells
              a title block would carry it in — the way in on the left, and the
              figure it is waiting on ranged right against the same edge every
              other line on the block ends at. */}
          <path
            d={`M${NOTE_X} ${FOOT_Y - 28}h${NOTE_W}`}
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
    </svg>
  );
}
