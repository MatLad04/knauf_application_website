"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowClockwise, ArrowRight, Basket, Heart } from "@phosphor-icons/react/dist/ssr";
import type { BuildUp } from "@/lib/catalogue";
import { lambda } from "@/lib/format";
import { compose, SUBSTRATES } from "@/lib/build-up";
import HatchDefs, { hatchFor } from "./hatch-defs";
import ProductFigure from "./product-figure";
import WallSection from "./wall-section";
import AnimatedNumber from "./animated-number";

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

  return (
    <div className="stage">
      {/* The hatch patterns, once. A `url(#…)` fill resolves document-wide, so
          the swatches in the tiles and the legend read from the same set the
          section is drawn with — and the drawing is never the reason a chip
          two columns away has a fill. */}
      <svg aria-hidden="true" focusable="false" className="sr-only">
        <HatchDefs />
      </svg>

      {/* --- Left: the four decisions, then what they produced. Scrolls. --- */}
      <div className="stage-flow min-w-0">
        <section aria-labelledby="choices-heading" className="choices">
          <div className="choices-head">
            <h2 id="choices-heading" className="label">
              Configure
            </h2>
            <button type="button" onClick={reset} disabled={untouched} className="reset">
              <ArrowClockwise size={12} weight="bold" aria-hidden="true" />
              Reset
            </button>
          </div>

          <Step n="01" title="Fix to" note="Existing construction, and a good part of the U-value.">
            <div
              role="radiogroup"
              aria-label="Substrate"
              className="tiles"
              onKeyDown={arrows(
                SUBSTRATES.map((o) => o.id),
                substrateId,
                setSubstrateId,
              )}
            >
              {SUBSTRATES.map((option) => (
                <Tile
                  key={option.id}
                  active={option.id === substrateId}
                  onSelect={() => setSubstrateId(option.id)}
                  code={SUBSTRATE_CODES[option.id] ?? "SUB"}
                  name={option.name}
                  figure={<Swatch hatch="substrate" />}
                  facts={[
                    { term: "R", value: option.r.toFixed(2) },
                    { term: "Depth", value: `${option.mm} mm` },
                  ]}
                />
              ))}
            </div>
          </Step>

          <Step
            n="02"
            title="Insulate with"
            note="One declared conductivity across every depth the family is made in."
          >
            <div
              role="radiogroup"
              aria-label="Insulation board"
              className="tiles"
              onKeyDown={arrows(
                boards.map((o) => o.family),
                board.family,
                setBoardFamily,
              )}
            >
              {boards.map((option) => (
                <Tile
                  key={option.family}
                  active={option.family === board.family}
                  onSelect={() => setBoardFamily(option.family)}
                  code={option.variants[0]?.code.replace(/-\d+$/, "") ?? option.family}
                  name={option.familyName}
                  figure={
                    <ProductFigure
                      textureKey={option.textureKey}
                      thicknessMm={option.variants[option.variants.length - 1]?.thicknessMm ?? null}
                    />
                  }
                  facts={[
                    { term: "λD", value: lambda(option.thermalConductivity) ?? "—", symbol: true },
                    { term: "Fire", value: option.reactionToFire ?? "—" },
                  ]}
                />
              ))}
            </div>
          </Step>

          <Step n="03" title="At a depth of" note="Only the depths this board is made in.">
            {/* Each depth carries the resistance it buys, so the trade the
                control is really offering is on the control. */}
            <div
              role="radiogroup"
              aria-label="Board depth in millimetres"
              className="depths"
              onKeyDown={arrows(
                board.variants.map((v) => String(v.thicknessMm)),
                String(variant.thicknessMm),
                (mm) => setThickness(Number(mm)),
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
                    onClick={() => setThickness(v.thicknessMm)}
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
          </Step>

          <Step
            n="04"
            title="Finish in"
            note="Usually where the fire class of the finished system is settled."
          >
            <div
              role="radiogroup"
              aria-label="Render"
              className="tiles"
              onKeyDown={arrows(
                renders.map((o) => o.slug),
                finish?.slug ?? "",
                setRenderSlug,
              )}
            >
              {renders.map((option) => (
                <Tile
                  key={option.slug}
                  active={option.slug === (finish?.slug ?? "")}
                  onSelect={() => setRenderSlug(option.slug)}
                  code={option.code}
                  name={option.familyName}
                  figure={<ProductFigure textureKey="render" />}
                  facts={[
                    { term: "Fire", value: option.reactionToFire ?? "—" },
                    // The label reads "2.0 mm grain"; the column is already called Grain.
                    { term: "Grain", value: option.variantLabel?.replace(/\s*grain$/i, "") ?? "—" },
                  ]}
                />
              ))}
            </div>
          </Step>
        </section>
      </div>

      {/* --- Right: what you built. -------------------------------------- */}
      <div className="stage-panel">
        <figure className="specimen-sheet">
          {/* The build-up in a sentence, over the drawing of it. It is the
              caption the section would carry on a sheet, so it goes where a
              caption goes: at the head, before the thing it names. */}
          <figcaption className="build-up">
            <p className="label">This build-up</p>
            <p className="build-up-line">
              <strong>{board.familyName}</strong> at {variant.thicknessMm} mm on{" "}
              {substrate.name.toLowerCase()}, finished in {finish?.familyName ?? "no render"}.
            </p>
          </figcaption>

          <div className="specimen-frame">
            <WallSection layers={built.layers} totalMm={built.depthMm} />

            {/* The legend, in installation order, keyed by the same hatch the
                bands are filled with. Static rows, so it can follow a drawing
                that moves — which a leader line joining two moving points
                cannot. */}
            <ol className="legend">
              {[...built.layers]
                .reverse()
                .filter((layer) => layer.hatch !== null && layer.mm > 0)
                .map((layer) => (
                  <li key={layer.id} className="legend-row">
                    <Swatch hatch={layer.hatch!} small />
                    <span className="legend-name">{layer.name}</span>
                    <span className="legend-mm">{layer.mm} mm</span>
                  </li>
                ))}
            </ol>
          </div>

          {/* The four figures the drawing above produced, joined to it rather
              than boxed away from it: a rule over each, the name, the value.
              Two columns, because four across is a strip of digits and four
              down is a list nobody reads to the end of. */}
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

          <p className="sr-only" aria-live="polite">
            {Math.round(built.depthMm)} millimetres deep. U-value {built.u.toFixed(3)} watts per
            square metre kelvin. Total thermal resistance {built.rTotal.toFixed(2)}. Reaction to
            fire {built.fire}.
          </p>
        </figure>

        {/* What you would do with it. The one that opens the product takes the
            full width because it is the one thing this page was building
            towards; the other three share a row under it. */}
        <div className="acts">
          <Link href={`/products/${variant.slug}`} className="btn btn-primary acts-lead">
            Open {variant.code}
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
          <Link
            href={`/products?application=external-wall&thickness_min=${variant.thicknessMm}&thickness_max=${variant.thicknessMm}`}
            className="btn btn-quiet btn-sm"
          >
            All at {variant.thicknessMm} mm
          </Link>
          <Link href="/in-development?feature=favourites" className="btn btn-quiet btn-sm">
            <Heart size={15} weight="bold" aria-hidden="true" />
            Save
          </Link>
          <Link href="/in-development?feature=basket" className="btn btn-quiet btn-sm">
            <Basket size={15} weight="bold" aria-hidden="true" />
            Quote
          </Link>
        </div>

        <p className="caption mt-4">
          Indicative. Kernbau does not exist and every declared value here is invented; a figure you
          could put on a drawing comes from a full EN ISO 6946 calculation with the fixings, the air
          gaps and the thermal bridging in it.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Step({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="step">
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
 * One option, as a tile rather than a row in a form.
 *
 * It carries the product drawn, the code a specifier writes down, the name, and
 * the one or two declared values that option decides. Selected is a two-pixel
 * signal edge and a signal ground, so which one is on is readable from across
 * the desk rather than from a tick.
 */
function Tile({
  active,
  onSelect,
  code,
  name,
  figure,
  facts,
}: {
  active: boolean;
  onSelect: () => void;
  code: string;
  name: string;
  figure: React.ReactNode;
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
      <span className="tile-figure">{figure}</span>
      <span className="tile-body">
        <span className="tile-name">{name}</span>
        {/* The code and the declared values share one line. Three stacked lines
            per tile is most of a screen spent on four decisions. */}
        <span className="tile-facts">
          <span className="mono tile-code">{code}</span>
          {facts.map((fact) => (
            <span key={fact.term} className="tile-fact">
              <span className={`tile-term ${fact.symbol ? "symbol" : ""}`}>{fact.term}</span>
              <span className="mono">{fact.value}</span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

/** A square of the material's own hatch, at the size of a sample chip. */
function Swatch({ hatch, small }: { hatch: string; small?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={small ? "swatch swatch-sm" : "swatch"}>
      <rect
        width="32"
        height="32"
        rx="3"
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
