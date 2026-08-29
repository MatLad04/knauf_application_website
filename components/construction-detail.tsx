"use client";

import { useState } from "react";
import type { Construction } from "@/data/constructions";
import ConstructionFigure from "./construction-figure";

/**
 * The narrow answer to the same question the turning stack answers.
 *
 * The stack is a labelled solid, and a labelled solid needs room on both sides
 * of itself for the names: at four hundred pixels the labels are wider than the
 * drawing and land on top of it. So below the width that holds it, the
 * construction is drawn the way this site has always drawn one — flat, in
 * section, numbered — with the names in a list beside it.
 *
 * The list and the drawing are the same layers said twice, so pointing at one
 * says it in the other, in both directions. It is the cheapest way to answer
 * the question a list always raises — *which* of these is the 2 mm one — and it
 * is the same link the stack makes with its leaders.
 */
export default function ConstructionDetail({ construction }: { construction: Construction }) {
  const [hot, setHot] = useState<number | null>(null);

  return (
    <div className="construction-detail">
      <div className="construction-detail-figure">
        <ConstructionFigure application={construction.id} active={hot} onHover={setHot} />
      </div>

      <ol className="mt-6" onMouseLeave={() => setHot(null)}>
        {construction.layers.map((layer, n) => (
          <li
            key={layer.id}
            data-hot={hot === n + 1 ? "true" : undefined}
            onMouseEnter={() => setHot(n + 1)}
            onFocus={() => setHot(n + 1)}
            tabIndex={0}
            className="layer-row flex items-center gap-4 border-b rule py-2.5 first:border-t"
          >
            <span className="mono w-6 shrink-0 text-xs text-muted">
              {String(n + 1).padStart(2, "0")}
            </span>
            <span className="text-sm">{layer.name}</span>
            <span className="mono ml-auto shrink-0 text-xs text-muted">
              {layer.thicknessMm > 0 ? `${layer.thicknessMm} mm` : "—"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
