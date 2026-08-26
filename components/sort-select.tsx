"use client";

import Form from "next/form";
import { useEffect, useRef, useState } from "react";
import { SORT_OPTIONS, type ProductQuery } from "@/lib/params";

/**
 * Sorting applies as it is chosen. A select that needs a second click to take
 * effect is a form pretending to be a control, and next/form turns the submit
 * into a client-side navigation, so the results change without the page moving.
 *
 * The button is the route without JavaScript, and it goes away once there is
 * some — the same trick the filter rail uses.
 */
export default function SortSelect({ query }: { query: ProductQuery }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [scripted, setScripted] = useState(false);
  useEffect(() => setScripted(true), []);

  return (
    <Form
      ref={formRef}
      action="/products"
      scroll={false}
      className="flex min-w-0 items-center gap-2"
      onChange={() => formRef.current?.requestSubmit()}
    >
      <PreservedInputs query={query} />

      <label htmlFor="sort" className="label shrink-0">
        Sort
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={query.sort}
        className="control min-w-0 px-2.5 py-1.5 text-sm"
      >
        {SORT_OPTIONS.filter((option) => option.key !== "relevance" || query.q).map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>

      {!scripted && (
        <button type="submit" className="control px-2.5 py-1.5 text-sm">
          Apply
        </button>
      )}
    </Form>
  );
}

/** Keeps the rest of the URL state when this one control posts one parameter. */
function PreservedInputs({ query }: { query: ProductQuery }) {
  const entries: [string, string][] = [];
  if (query.q) entries.push(["q", query.q]);
  if (query.categories.length) entries.push(["category", query.categories.join(",")]);
  if (query.applications.length) entries.push(["application", query.applications.join(",")]);
  if (query.fireClasses.length) entries.push(["fire", query.fireClasses.join(",")]);
  if (query.lambdaMax !== null) entries.push(["lambda_max", String(query.lambdaMax)]);
  if (query.thicknessMin !== null) entries.push(["thickness_min", String(query.thicknessMin)]);
  if (query.thicknessMax !== null) entries.push(["thickness_max", String(query.thicknessMax)]);
  if (query.epdOnly) entries.push(["epd", "1"]);
  if (query.view !== "grid") entries.push(["view", query.view]);
  if (query.compare.length) entries.push(["compare", query.compare.join(",")]);

  return (
    <>
      {entries.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}
