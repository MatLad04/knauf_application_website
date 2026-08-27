"use client";

import { useEffect, useRef, useState } from "react";
import type { Facets } from "@/lib/catalogue";
import Select from "./select";
import { FIRE_CLASSES, LIMITS, type ProductQuery } from "@/lib/params";

const LAMBDA_STEPS = [0.032, 0.035, 0.038, 0.04, 0.045];

/**
 * A plain GET form, so every filter state is still a real URL — and with a
 * script running, the submit is handed to the catalogue browser instead, which
 * swaps the results without the page going anywhere.
 *
 * The search field is not here — it belongs in the bar above, so it carries
 * through as a hidden value.
 */
export default function Filters({
  facets,
  query,
  onApply,
}: {
  facets: Facets;
  query: ProductQuery;
  /** Given the form's own state. Returning false lets the form submit. */
  onApply?: (form: HTMLFormElement) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [lambdaMax, setLambdaMax] = useState(
    query.lambdaMax === null ? "" : String(query.lambdaMax),
  );
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

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!onApply) return;
    event.preventDefault();
    onApply(event.currentTarget);
  };

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

      <form
        ref={formRef}
        action="/products"
        method="get"
        id="filter-panel"
        onChange={applyOnChange}
        onSubmit={submit}
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
          <p className="label" id="lambda-label">
            Thermal conductivity <span className="symbol">λD</span>
          </p>
          {/* Held here rather than read off the DOM at submit time: the drawn
              listbox posts through a hidden input, and a hidden input only
              changes when something tells it to. */}
          <Select
            name="lambda_max"
            label="Maximum thermal conductivity"
            mono
            value={lambdaMax}
            onChange={(next) => {
              setLambdaMax(next);
              // The form has not re-rendered with the new hidden value yet, so
              // the submit waits a frame for it.
              requestAnimationFrame(applyOnChange);
            }}
            options={[
              { value: "", label: "No limit" },
              ...LAMBDA_STEPS.map((step) => ({
                value: String(step),
                label: `≤ ${step.toFixed(3)} W/(m·K)`,
              })),
            ]}
            className="mt-3"
          />
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
          <a
            href="/products"
            onClick={(event) => {
              if (!onApply) return;
              event.preventDefault();
              formRef.current?.reset();
              const form = formRef.current;
              if (!form) return;
              for (const el of form.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))
                el.checked = false;
              for (const el of form.querySelectorAll<HTMLSelectElement>("select")) el.value = "";
              setLambdaMax("");
              for (const el of form.querySelectorAll<HTMLInputElement>("input[type=number]"))
                el.value = "";
              onApply(form);
            }}
            className="btn btn-quiet flex-1 py-2.5 text-sm"
          >
            Clear all
          </a>
        </div>
      </form>
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
