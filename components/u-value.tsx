"use client";

import { useState } from "react";

const RSI = 0.13; // internal surface resistance, m²K/W
const RSE = 0.04; // external surface resistance

/**
 * R = d / λ for this layer, and the U-value the wall reaches once it is added.
 * An indication only: a real calculation follows EN ISO 6946 and accounts for
 * fixings, air gaps and thermal bridging.
 */
export default function UValueHelper({
  thicknessMm,
  lambda,
}: {
  thicknessMm: number;
  lambda: number;
}) {
  const [thickness, setThickness] = useState(String(thicknessMm));
  const [existingR, setExistingR] = useState("0.60");

  const d = Number.parseFloat(thickness);
  const rExisting = Number.parseFloat(existingR);

  const valid =
    Number.isFinite(d) && d > 0 && d <= 500 && Number.isFinite(rExisting) && rExisting >= 0;

  const rLayer = valid ? d / 1000 / lambda : null;
  const uValue = rLayer === null ? null : 1 / (RSI + rExisting + rLayer + RSE);

  return (
    <div className="px-5 py-6">
      <h3 className="label">U-value contribution</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Insulation thickness, mm
          <input
            type="number"
            inputMode="numeric"
            value={thickness}
            onChange={(event) => setThickness(event.target.value)}
            min={1}
            max={500}
            className="control mono mt-1 w-full px-3 py-2"
          />
        </label>

        <label className="text-sm">
          Existing construction R, m²K/W
          <input
            type="number"
            inputMode="decimal"
            step="0.05"
            value={existingR}
            onChange={(event) => setExistingR(event.target.value)}
            min={0}
            className="control mono mt-1 w-full px-3 py-2"
          />
        </label>
      </div>

      <p aria-live="polite" className="mt-4 text-sm">
        {valid ? (
          <>
            <span className="mono text-ink text-lg">R = {rLayer!.toFixed(2)}</span>
            <span className="text-muted"> m²K/W for this layer</span>
            <br />
            <span className="mono text-ink text-lg">U = {uValue!.toFixed(3)}</span>
            <span className="text-muted"> W/(m²K) for the assembly</span>
          </>
        ) : (
          <span className="text-muted">
            Enter a thickness between 1 and 500 mm and a resistance of zero or more.
          </span>
        )}
      </p>

      <p className="mt-3 text-xs text-muted">
        Rsi {RSI} + Rse {RSE} m²K/W. Indicative only. A specification value comes from a full EN ISO
        6946 calculation including fixings and thermal bridging.
      </p>
    </div>
  );
}
