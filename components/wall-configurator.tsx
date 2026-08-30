"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowClockwise, ArrowRight, Basket, Heart } from "@phosphor-icons/react/dist/ssr";
import type { BuildUp } from "@/lib/catalogue";
import { lambda, productNameLines } from "@/lib/format";
import { compose, SUBSTRATES } from "@/lib/build-up";
import HatchDefs, { hatchFor } from "./hatch-defs";
import WallSection from "./wall-section";
import AnimatedNumber from "./animated-number";
import { Enter } from "./motion";

/**
 * The wall configurator.
 *
 * The rest of the catalogue answers "what is this board?". This answers the
 * question a specifier actually arrives with — "how deep does the wall get, and
 * what U-value do I end up with?" — and neither of those is a property of a
 * board. They belong to the build-up, so the build-up is what you configure.
 *
 * Three rules it is built to:
 *
 * One, an option shows what choosing it does. Every tile carries the figure
 * that option decides — R for a substrate, λD and Euroclass for a board, the
 * resistance it buys for a depth — so the answer to "what does this mean" is on
 * the control rather than two paragraphs away.
 *
 * Two, the specimen never leaves. The section and its four figures are pinned;
 * scrolling past the choices brings the schedule up underneath them. A
 * configurator where the answer scrolls off the top while you are still
 * changing the question is a form, not a tool.
 *
 * Three, one truth. Nothing here derives a value: `compose` in `lib/build-up`
 * takes the four choices and returns the drawing's bands, the schedule's rows
 * and every figure, so the section and the table cannot disagree.
 */

/**
 * Arrow keys for a radio group.
 *
 * A roving tabindex puts one stop in the group rather than one per option,
 * which is right — but it only works if the arrows then move the selection.
 * Without this, everything but the option already chosen is unreachable from
 * the keyboard, which is worse than no roving at all.
 */
function arrows(ids: string[], value: string, onChange: (id: string) => void) {
  return (event: React.KeyboardEvent) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step === 0) return;

    event.preventDefault();
    const i = ids.indexOf(value);
    const next = ids[(i + step + ids.length) % ids.length];
    if (next !== undefined) onChange(next);
  };
}

/** Substrates are constructions rather than catalogue products, so they carry a
    designation rather than a code — but they are chosen the same way. */
const SUBSTRATE_CODES: Record<string, string> = {
  "dense-block": "SUB-DB",
  aircrete: "SUB-AC",
  brick: "SUB-BR",
  concrete: "SUB-RC",
};

export default function WallConfigurator({ buildUp }: { buildUp: BuildUp }) {
  const { boards, renders, adhesive, baseCoat, mesh, primer, anchors } = buildUp;

  // The non-combustible slab is the default rather than the lowest λ: a wall
  // that starts at Euroclass A1 is the one a specifier can always fall back to,
  // and the depths show what trading it away buys.
  const defaultBoard = (boards.find((b) => b.categorySlug === "mineral-wool") ?? boards[0])?.family;

  // Which layer is being pointed at, in the drawing or in the schedule beside
  // it. One piece of state for both, because it is one question.
  const [hot, setHot] = useState<string | null>(null);

  const [substrateId, setSubstrateId] = useState(SUBSTRATES[0]!.id);
  const [boardFamily, setBoardFamily] = useState(defaultBoard ?? "");
  const [thickness, setThickness] = useState<number | null>(null);
  const [renderSlug, setRenderSlug] = useState(renders[0]?.slug ?? "");

  const substrate = SUBSTRATES.find((s) => s.id === substrateId) ?? SUBSTRATES[0]!;
  const board = boards.find((b) => b.family === boardFamily) ?? boards[0];
  const finish = renders.find((r) => r.slug === renderSlug) ?? renders[0] ?? null;

  // Held as a number rather than a slug, so changing board keeps the depth you
  // were working at wherever that board is also made in it.
  const variant = useMemo(() => {
    if (!board) return null;
    return (
      board.variants.find((v) => v.thicknessMm === thickness) ??
      board.variants[board.variants.length - 1] ??
      null
    );
  }, [board, thickness]);

  const built = useMemo(() => {
    if (!board || !variant) return null;
    return compose({
      substrate,
      board,
      variant,
      finish,
      adhesive,
      baseCoat,
      mesh,
      primer,
      // Anchors are sold to suit a depth of board: the right one is the
      // shortest that still reaches through what you have chosen.
      anchor: anchors.find((a) => (a.forThicknessMm ?? 0) >= variant.thicknessMm) ?? null,
    });
  }, [substrate, board, variant, finish, adhesive, baseCoat, mesh, primer, anchors]);

  if (!board || !variant || !built) return null;

  const untouched =
    substrateId === SUBSTRATES[0]!.id &&
    boardFamily === defaultBoard &&
    thickness === null &&
    renderSlug === (renders[0]?.slug ?? "");

  const reset = () => {
    setSubstrateId(SUBSTRATES[0]!.id);
    setBoardFamily(defaultBoard ?? "");
    setThickness(null);
    setRenderSlug(renders[0]?.slug ?? "");
  };

  // Each control, and the part of the wall it sets. Named rather than inlined,
  // because the depth control hands them to a keyboard helper as well as to a
  // click, and 02 and 03 are two questions about the same band.
  const pickSubstrate = (id: string) => setSubstrateId(id);
  const pickBoard = (family: string) => setBoardFamily(family);
  const pickDepth = (mm: number) => setThickness(mm);
  const pickRender = (slug: string) => setRenderSlug(slug);

  const buildUpName = productNameLines(board.familyName, `${variant.thicknessMm} mm`);

  return (
    <>
      <div className="stage">
        {/* The head of the sheet. It states its subject the way a drawing
            states it — the verb small over the thing being drawn — and the
            thing being drawn is the board the four groups under it are
            configuring, so the title is the answer so far.

            It sits inside the stage rather than over it, which is what stops
            its rule at the edge of the choices: the rule closes the head of
            the data configuration, and the drawing beside it is not part of
            what is being headed. Reset rides at the far end of that line,
            where it belongs to the choices it undoes. */}
        <Enter className="config-head">
          <h1 className="display config-title">
            <span className="config-verb">Configuring</span>
            <span className="config-line">{buildUpName[0]}</span>{" "}
            <span className="config-line">{buildUpName[1]}</span>
          </h1>

          <button type="button" onClick={reset} disabled={untouched} className="reset">
            <ArrowClockwise size={12} weight="bold" aria-hidden="true" />
            Reset
          </button>
        </Enter>

        {/* The hatch patterns, once. A `url(#…)` fill resolves document-wide, so
            the swatches in the tiles and the legend read from the same set the
            section is drawn with — and the drawing is never the reason a chip
            two columns away has a fill. */}
        <svg aria-hidden="true" focusable="false" className="sr-only">
          <HatchDefs />
        </svg>

        {/* --- The four decisions ------------------------------------------

            Two columns of two, filled across: the substrate and the board that
            goes on it on the first line, the depth of that board and what
            covers it on the second. They are placed rather than stacked in two
            flanks, so the order they are read in is the order they are asked
            in — 01 beside 02, 03 beside 04 — and neither column ends in a band
            of nothing while the other runs long. */}
        <Step area="step-a" n="01" title="Fix to" note="The existing construction.">
          <div
            role="radiogroup"
            aria-label="Substrate"
            className="tiles"
            onKeyDown={arrows(
              SUBSTRATES.map((o) => o.id),
              substrateId,
              pickSubstrate,
            )}
          >
            {SUBSTRATES.map((option) => (
              <Tile
                key={option.id}
                active={option.id === substrateId}
                onSelect={() => pickSubstrate(option.id)}
                code={SUBSTRATE_CODES[option.id] ?? "SUB"}
                name={option.name}
                hatch={`sub-${option.id}`}
                facts={[
                  { term: "R", value: option.r.toFixed(2) },
                  { term: "Depth", value: `${option.mm} mm` },
                ]}
              />
            ))}
          </div>
        </Step>

        <Step area="step-b" n="02" title="Insulate with" note="One λD at every depth.">
          <div
            role="radiogroup"
            aria-label="Insulation board"
            className="tiles"
            onKeyDown={arrows(
              boards.map((o) => o.family),
              board.family,
              pickBoard,
            )}
          >
            {boards.map((option) => (
              <Tile
                key={option.family}
                active={option.family === board.family}
                onSelect={() => pickBoard(option.family)}
                code={option.variants[0]?.code.replace(/-\d+$/, "") ?? option.family}
                name={option.familyName}
                hatch={option.categorySlug}
                facts={[
                  {
                    term: "λD",
                    value: lambda(option.thermalConductivity) ?? "—",
                    symbol: true,
                  },
                  { term: "Fire", value: option.reactionToFire ?? "—" },
                ]}
              />
            ))}
          </div>
        </Step>

        <Step area="step-c" n="03" title="At a depth of" note="Depths this board is made in.">
          {/* Each depth carries the resistance it buys, so the trade the
                control is really offering is on the control. */}
          <div
            role="radiogroup"
            aria-label="Board depth in millimetres"
            className="depths"
            // Two rows, filled across, so a scale still reads left to right.
            // The count is the component's to know, not the stylesheet's: five
            // depths is three columns and six is three as well, and neither is
            // something `auto-fit` can be told.
            style={{ "--depth-cols": Math.ceil(board.variants.length / 2) } as React.CSSProperties}
            onKeyDown={arrows(
              board.variants.map((v) => String(v.thicknessMm)),
              String(variant.thicknessMm),
              (mm) => pickDepth(Number(mm)),
            )}
          >
            {board.variants.map((v) => {
              const active = v.thicknessMm === variant.thicknessMm;
              return (
                <button
                  key={v.slug}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  data-active={active ? "true" : undefined}
                  onClick={() => pickDepth(v.thicknessMm)}
                  className="depth"
                >
                  <span className="depth-mm">{v.thicknessMm}</span>
                  <span className="depth-r">
                    R {(v.thicknessMm / 1000 / board.thermalConductivity).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* What the two controls above have just settled, read off the
                same way the panel reads off the wall: the declared conductivity
                that does not change with depth, the resistance this depth buys,
                and how much of the finished wall that is. Three cells on one
                row, so the group costs a line rather than a block. */}
          <dl className="depth-figures">
            <div className="depth-figure">
              <dt className="symbol">λD</dt>
              <dd>
                {lambda(board.thermalConductivity) ?? "—"} <span>W/(m·K)</span>
              </dd>
            </div>
            <div className="depth-figure">
              <dt>R at {variant.thicknessMm} mm</dt>
              <dd>
                {(variant.thicknessMm / 1000 / board.thermalConductivity).toFixed(2)}{" "}
                <span>m²K/W</span>
              </dd>
            </div>
            <div className="depth-figure">
              <dt>Share of wall</dt>
              <dd>
                {Math.round(
                  (variant.thicknessMm / 1000 / board.thermalConductivity / built.rTotal) * 100,
                )}{" "}
                <span>%</span>
              </dd>
            </div>
          </dl>
        </Step>

        <Step area="step-d" n="04" title="Finish in" note="Settles the system's fire class.">
          <div
            role="radiogroup"
            aria-label="Render"
            className="tiles"
            onKeyDown={arrows(
              renders.map((o) => o.slug),
              finish?.slug ?? "",
              pickRender,
            )}
          >
            {renders.map((option) => (
              <Tile
                key={option.slug}
                active={option.slug === (finish?.slug ?? "")}
                onSelect={() => pickRender(option.slug)}
                code={option.code}
                name={option.familyName}
                hatch={`render-${option.family}`}
                // Grain is 2.0 mm on all three, so a column of it decides
                // nothing; the fire class is what this group settles, and it
                // is the one figure that differs between the options.
                facts={[{ term: "Fire", value: option.reactionToFire ?? "—" }]}
              />
            ))}
          </div>
        </Step>

        {/* --- The middle: what you built. ---------------------------------

            The specimen is the subject of the sheet, so it is drawn in the
            middle of it at whatever size the window allows, hung between two
            hairlines with the decisions on either side. What it measures is not
            here: those four figures are the title block along the foot, which
            is where a drawing states what it comes to. */}
        <div className="stage-panel">
          <figure className="specimen-sheet">
            {/* Named and nothing more: the product it is a section of is the
                title of the page now, so repeating it here was the same sentence
                twice with a drawing between them. */}
            <figcaption className="build-up">
              <p className="label">This build-up</p>
            </figcaption>

            <div className="specimen-frame">
              {/* The drawing is taken out of flow inside its own cell. An
                  `svg` with a `viewBox` and no height of its own claims the
                  height its width implies, which would make the drawing decide
                  how tall the sheet is; here the sheet decides, and the drawing
                  takes what the figures and the actions under it leave. */}
              <div className="specimen-stage">
                <WallSection
                  layers={built.layers}
                  totalMm={built.depthMm}
                  hot={hot}
                  onHover={setHot}
                />
              </div>

              {/* The legend, in installation order, keyed by the same hatch the
                  bands are filled with. Static rows, so it can follow a drawing
                  that moves — which a leader line joining two moving points
                  cannot. Pointing at a row holds its band in the drawing, and
                  pointing at a band holds its row: the two are the same layers
                  said twice, and neither should have to be counted against the
                  other. */}
              <ol className="legend" onMouseLeave={() => setHot(null)}>
                {[...built.layers]
                  .reverse()
                  .filter((layer) => layer.hatch !== null && layer.mm > 0)
                  .map((layer) => (
                    <li
                      key={layer.id}
                      data-hot={hot === layer.id ? "true" : undefined}
                      onMouseEnter={() => setHot(layer.id)}
                      className="legend-row"
                    >
                      <Swatch hatch={layer.hatch!} size="row" />
                      <span className="legend-name">{layer.name}</span>
                      <span className="legend-mm">{layer.mm} mm</span>
                    </li>
                  ))}
              </ol>
            </div>
          </figure>

          {/* The title block, under the drawing it belongs to. Four figures
              two to a line, then the things you would do with the build-up
              beneath them: read the section, read what it comes to, act. */}
          <div className="stage-foot">
            <dl className="specs">
              <Spec term="Depth" unit="mm">
                <AnimatedNumber value={built.depthMm} />
              </Spec>
              <Spec term="U-value" unit="W/(m²K)">
                <AnimatedNumber value={built.u} decimals={3} />
              </Spec>
              <Spec term="R total" unit="m²K/W">
                <AnimatedNumber value={built.rTotal} decimals={2} />
              </Spec>
              <Spec term="Reaction to fire">{built.fire}</Spec>
            </dl>

            <div className="acts">
              <Link href="/in-development?feature=favourites" className="btn btn-primary">
                <Heart size={16} weight="bold" aria-hidden="true" />
                Save
              </Link>
              <Link href="/in-development?feature=basket" className="btn btn-quiet">
                <Basket size={16} weight="bold" aria-hidden="true" />
                Add to cart
              </Link>
              <Link href={`/products/${variant.slug}`} className="btn btn-quiet btn-sm acts-wide">
                Open {variant.code}
                <ArrowRight size={14} weight="bold" aria-hidden="true" />
              </Link>
            </div>

            <p className="sr-only" aria-live="polite">
              {Math.round(built.depthMm)} millimetres deep. U-value {built.u.toFixed(3)} watts per
              square metre kelvin. Total thermal resistance {built.rTotal.toFixed(2)}. Reaction to
              fire {built.fire}.
            </p>
          </div>
        </div>

        {/* The note along the foot of the sheet, under the rule that closes it.
            It qualifies every figure above it, so it runs the width of all
            three columns rather than sitting under one of them. */}
        <p className="caption stage-note">
          Indicative. Kernbau is invented, and so is every declared value here — a figure you could
          put on a drawing comes from a full EN ISO 6946 calculation, with the fixings, the air gaps
          and the thermal bridging in it.
        </p>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Step({
  area,
  n,
  title,
  note,
  children,
}: {
  area: string;
  n: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`step ${area}`}>
      <div className="step-head">
        <span className="mono step-n">{n}</span>
        <h3 className="step-title">{title}</h3>
        <p className="step-note">{note}</p>
      </div>
      {children}
    </section>
  );
}

type Fact = { term: string; value: string; symbol?: boolean };

/**
 * One option, as a line on a schedule rather than a card in a deck.
 *
 * Two lines: the name, and under it the code a specifier writes down beside the
 * one or two declared values that option decides. The code and the values sit
 * in fixed tracks, so reading down a group compares like against like instead
 * of chasing figures that move with the length of the name above them.
 *
 * The chip on the left is the material's own hatch — the same fill the band
 * takes in the section — so choosing an option and seeing the drawing change is
 * one gesture rather than two facts to reconcile.
 */
function Tile({
  active,
  onSelect,
  code,
  name,
  hatch,
  facts,
}: {
  active: boolean;
  onSelect: () => void;
  code: string;
  name: string;
  hatch: string;
  facts: Fact[];
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      data-active={active ? "true" : undefined}
      onClick={onSelect}
      className="tile"
    >
      <Swatch hatch={hatch} />
      <span className="tile-body">
        <span className="tile-name">{name}</span>
        <span className="tile-facts">
          <span className="mono tile-code">{code}</span>
          {facts.map((fact) => (
            <span key={fact.term} className="tile-fact">
              <span className={`tile-term ${fact.symbol ? "symbol" : ""}`}>{fact.term}</span>
              <span className="mono tile-value">{fact.value}</span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

/**
 * A square of the material's own hatch, at the size of a sample chip.
 *
 * The `viewBox` shrinks with the chip rather than the pattern scaling down
 * inside a fixed one: a hatch reduced to a fifth of its drawn size is grey
 * noise, and the whole point of the chip is that it is the fill you will find
 * in the section.
 */
function Swatch({ hatch, size = "chip" }: { hatch: string; size?: "chip" | "row" }) {
  const box = size === "row" ? 16 : 22;
  return (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden="true"
      className={size === "row" ? "swatch swatch-row" : "swatch swatch-chip"}
    >
      <rect
        width={box}
        height={box}
        rx="2.5"
        fill={`url(#${hatchFor(hatch)})`}
        stroke="var(--color-edge)"
        strokeWidth="1"
      />
    </svg>
  );
}

/**
 * A resulting figure: a rule, what it is called, and what it came out at.
 *
 * The glyphs and the one-line explanations that used to ride on these were a
 * second reading of the same four numbers, in a panel whose whole job is to be
 * read at a glance. The drawing above says what the wall is; these say what it
 * measures, and nothing here has to be decoded.
 */
function Spec({
  term,
  unit,
  children,
}: {
  term: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="spec">
      <dt className="spec-term">{term}</dt>
      <dd className="spec-value">
        {children}
        {unit && <span className="spec-unit">{unit}</span>}
      </dd>
    </div>
  );
}
