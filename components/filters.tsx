"use client";

import Form from "next/form";
import { useEffect, useRef, useState } from "react";
import type { Facets } from "@/lib/catalogue";
import { FIRE_CLASSES, LIMITS, type ProductQuery } from "@/lib/params";

const LAMBDA_STEPS = [0.032, 0.035, 0.038, 0.04, 0.045];

/**
 * A plain GET form, so every filter state is a real URL. next/form turns the
 * submit into a client-side navigation; the change handler submits early so a
 * checkbox applies immediately instead of waiting for the button.
 *
 * The search field is not here — it belongs in the band above, so it carries
 * through as a hidden value.
 */
export default function Filters({ facets, query }: { facets: Facets; query: ProductQuery }) {
  const formRef = useRef<HTMLFormElement>(null);
  // Starts open so the panel is usable without JavaScript, where the toggle
  // button does nothing. Once hydrated it collapses into a disclosure on small
  // screens; from `lg` up it is always visible anyway.
  const [open, setOpen] = useState(true);
  // `scripted` also decides whether the Apply button is worth showing: the
  // change handler above already applies a filter as it is chosen, so the
  // button is only the route for a browser that is not running this.
  const [scripted, setScripted] = useState(false);
  useEffect(() => {
    setOpen(false);
    setScripted(true);
  }, []);

  const applyOnChange = () => formRef.current?.requestSubmit();

  return (
    <>
      <button
        type="button"
        className="btn btn-quiet w-full lg:hidden"
        aria-expanded={open}
        aria-controls="filter-panel"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide filters" : "Show filters"}
      </button>

      <Form
        ref={formRef}
        action="/products"
        id="filter-panel"
        onChange={applyOnChange}
        className={`${open ? "block" : "hidden"} mt-4 lg:mt-0 lg:block`}
      >
        {/* Carried through so filtering does not reset the search, view or sort. */}
        {query.q && <input type="hidden" name="q" value={query.q} />}
        <input type="hidden" name="view" value={query.view} />
        <input type="hidden" name="sort" value={query.sort} />
        {query.compare.length > 0 && (
          <input type="hidden" name="compare" value={query.compare.join(",")} />
        )}

        <FilterGroup legend="Application">
          {facets.applications.map((facet) => (
            <Choice
              key={facet.value}
              name="application"
              value={facet.value}
              label={facet.label}
              count={facet.count}
              checked={query.applications.includes(facet.value)}
            />
          ))}
        </FilterGroup>

        <FilterGroup legend="Category">
          {facets.categories.map((facet) => (
            <Choice
              key={facet.value}
              name="category"
              value={facet.value}
              label={facet.label}
              count={facet.count}
              checked={query.categories.includes(facet.value)}
            />
          ))}
        </FilterGroup>

        <FilterGroup legend="Reaction to fire" hint="EN 13501-1">
          {facets.fireClasses.map((facet) => {
            const euroclass = FIRE_CLASSES.find((c) => c.value === facet.value);
            return (
              <Choice
                key={facet.value}
                name="fire"
                value={facet.value}
                label={facet.label}
                hint={euroclass?.note}
                count={facet.count}
                checked={query.fireClasses.includes(facet.value)}
                mono
              />
            );
          })}
        </FilterGroup>

        <div className="border-b rule py-5">
          <label htmlFor="lambda_max" className="label">
            Thermal conductivity <span className="symbol">λD</span>
          </label>
          <select
            id="lambda_max"
            name="lambda_max"
            defaultValue={query.lambdaMax ?? ""}
            className="control mono mt-3 w-full px-3 py-2 text-sm"
          >
            <option value="">No limit</option>
            {LAMBDA_STEPS.map((step) => (
              <option key={step} value={step}>
                ≤ {step.toFixed(3)} W/(m·K)
              </option>
            ))}
          </select>
        </div>

        <fieldset className="border-b rule py-5">
          <legend className="label">Thickness</legend>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              name="thickness_min"
              aria-label="Minimum thickness in millimetres"
              placeholder="min"
              min={LIMITS.thickness.min}
              max={LIMITS.thickness.max}
              step={LIMITS.thickness.step}
              defaultValue={query.thicknessMin ?? ""}
              className="control mono w-full px-3 py-2 text-sm"
            />
            <span aria-hidden="true" className="text-muted">
              to
            </span>
            <input
              type="number"
              name="thickness_max"
              aria-label="Maximum thickness in millimetres"
              placeholder="max"
              min={LIMITS.thickness.min}
              max={LIMITS.thickness.max}
              step={LIMITS.thickness.step}
              defaultValue={query.thicknessMax ?? ""}
              className="control mono w-full px-3 py-2 text-sm"
            />
          </div>
          <p className="caption mt-2">
            {facets.bounds.thicknessMin} to {facets.bounds.thicknessMax} mm in this catalogue
          </p>
        </fieldset>

        <div className="border-b rule py-5">
          <Choice
            name="epd"
            value="1"
            label="Environmental Product Declaration"
            count={facets.epdCount}
            checked={query.epdOnly}
          />
        </div>

        <div className="mt-6 flex gap-2">
          {!scripted && (
            <button type="submit" className="btn btn-primary flex-1 py-2.5 text-sm">
              Apply
            </button>
          )}
          <a href="/products" className="btn btn-quiet flex-1 py-2.5 text-sm">
            Clear all
          </a>
        </div>
      </Form>
    </>
  );
}

function FilterGroup({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-b rule py-5 first:pt-0">
      <legend className="label">
        {legend}
        {hint && <span className="normal-case tracking-normal"> {hint}</span>}
      </legend>
      <div className="mt-3 grid gap-2">{children}</div>
    </fieldset>
  );
}

function Choice({
  name,
  value,
  label,
  hint,
  count,
  checked,
  mono,
}: {
  name: string;
  value: string;
  label: string;
  hint?: string;
  count: number;
  checked: boolean;
  mono?: boolean;
}) {
  const id = `${name}-${value}`;
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        // Zero is still selectable when already applied, so a filter can be undone.
        disabled={count === 0 && !checked}
        className="accent-[color:var(--color-signal)] size-4 shrink-0 translate-y-0.5"
      />
      <label htmlFor={id} className={`flex-1 ${count === 0 && !checked ? "text-muted" : ""}`}>
        <span className={mono ? "font-mono" : ""}>{label}</span>
        {hint && <span className="text-muted">, {hint}</span>}
      </label>
      <span className="mono text-xs text-muted tabular-nums">{count}</span>
    </div>
  );
}
