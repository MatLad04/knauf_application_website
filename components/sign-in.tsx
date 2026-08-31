"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import InDev from "./in-dev";
import SheetNotes from "./sheet-notes";

type Mode = "sign-in" | "create";

/**
 * What is actually behind the door, in the order it would matter.
 *
 * The plate had a section drawn on it, which said what the catalogue is about
 * but nothing about what signing in is for. Three lines say the second thing,
 * and a numbered schedule is how this site lists anything it means to be read
 * in order — the same figures-then-note rhythm as the notes on a drawing.
 */
const HOLDS = [
  "Shortlists that outlive the browser they were made in.",
  "Schedules, with the quantities and the areas already worked out.",
  "A record of what a product declared on the day it was specified.",
];

/** The two people this catalogue is written for, and they arrive differently. */
const ROLES = [
  {
    key: "specifier",
    label: "I specify",
    note: "Architect, engineer or technologist. Saved shortlists, project folders and a record of what was declared when.",
  },
  {
    key: "trade",
    label: "I buy",
    note: "Contractor, applicator or merchant. Schedules priced by a distributor, and delivery against a drawing.",
  },
] as const;

/**
 * The sign-in sheet.
 *
 * Full bleed, because signing in is the one thing on this site that is not the
 * catalogue: the bar, the search and the footer all belong to browsing, and
 * leaving them up around a login turns a decision into a detour. The way back
 * is the arrow, which is the only navigation on the page.
 *
 * Two arrangements of the same parts. Above `lg` the black plate takes half the
 * screen with the section drawn on it, and the form takes the other half; below
 * it the plate flattens to a band across the top and the form runs underneath.
 * Either way the plate names the page in type three times the size of anything
 * else, and the form column opens on a greeting and the line that says what to
 * type — never on a second "Sign in", which would be the page saying the same
 * thing twice in two sizes.
 *
 * Nothing here is wired, and each control that is not says so where it stands
 * rather than pretending. The fields take what you type and the buttons carry
 * the office's own "not issued" stamp beside them; none of them do anything.
 * A form that silently swallowed a password would be the one dishonest control
 * on the site.
 */
export default function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [role, setRole] = useState<(typeof ROLES)[number]["key"]>("specifier");
  const ids = useId();

  const creating = mode === "create";

  // Said once and placed twice. Above `lg` it sits under the form's heading;
  // below it there is no form heading — the banner has already said "sign in"
  // in type three times the size, and a page that says it again immediately
  // underneath is a page repeating itself — so the instruction moves up into
  // the banner and the form starts at the first field.
  const instruction = creating
    ? "Two fields now, the rest when there is something to put in them."
    : "Enter the address the account is under and we will send a one-time code.";

  // A direct arrival has nothing behind it, so the arrow goes to the front door
  // rather than out of the site.
  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const switchTo = (next: Mode) => setMode(next);

  return (
    <div className="auth">
      <section className="auth-plate">
        <div className="auth-plate-head">
          <button type="button" onClick={back} className="auth-back" aria-label="Go back">
            <ArrowLeft size={20} weight="bold" aria-hidden="true" />
          </button>

          <Link href="/" className="auth-mark display" aria-label="Kernbau, home">
            <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="logomark">
              <rect width="32" height="32" fill="currentColor" />
              <g fill="#000000">
                <rect x="6" y="7" width="20" height="4" />
                <rect x="6" y="13" width="20" height="7" opacity="0.55" />
                <rect x="6" y="22" width="20" height="4" opacity="0.8" />
              </g>
            </svg>
            KERNBAU
          </Link>
        </div>

        <div className="auth-plate-body">
          {/* The verb takes its own line and the full white; what the account
              is for follows underneath, held back off it. Two lines, and the
              break is where the sentence turns rather than wherever the measure
              happens to run out. */}
          <h1 className="display auth-title">
            <span className="auth-title-lit">{creating ? "Create" : "Sign in to"}</span>
            your account.
          </h1>
        </div>

        {/* Set at the foot of the plate rather than under the heading, so the
            three of them and the sentence above hold opposite ends of it
            instead of collecting in the middle. */}
        <SheetNotes tone="dark" title="What an account would hold" items={HOLDS} />
      </section>

      <section className="auth-form-side">
        <div className="auth-form">
          {/* The plate has already named the page, so this is a greeting rather
              than a second title — and under it the one line that says what to
              do with the field below. Without them the column opened on a bare
              input, which reads as the middle of a form rather than the start
              of one. */}
          <div className="auth-form-head">
            <h2 className="display auth-form-title">Welcome to Kernbau</h2>
            <p className="auth-form-lead">{instruction}</p>
          </div>

          {/* A form with nothing behind it. The submit is tagged rather than
              wired, and the only handler left is the one that stops the browser
              navigating away on Enter. */}
          {/* `noValidate`, and the submit is a plain button: the browser was
              running its own constraint validation on a form with nothing
              behind it, so a dead control answered with "Please fill out this
              field" over a field nobody reads. */}
          <form className="auth-fields" noValidate onSubmit={(event) => event.preventDefault()}>
            <Field id={`${ids}-email`} label="Email address" type="email" autoComplete="email" />

            {!creating && (
              <Field
                id={`${ids}-password`}
                label="Password"
                type="password"
                autoComplete="current-password"
                hint="Optional — leave it and we send a code instead."
              />
            )}

            {creating && (
              <fieldset className="auth-roles">
                <legend className="field-label">What you use it for</legend>
                {ROLES.map((option) => (
                  <label
                    key={option.key}
                    className="auth-role"
                    data-active={role === option.key ? "true" : undefined}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.key}
                      checked={role === option.key}
                      onChange={() => setRole(option.key)}
                      className="sr-only"
                    />
                    <span className="auth-role-label">{option.label}</span>
                    <span className="auth-role-note">{option.note}</span>
                  </label>
                ))}
              </fieldset>
            )}

            {!creating && (
              <div className="auth-row">
                <InDev side="right" note="Password reset needs an account to reset.">
                  <button type="button" aria-disabled="true" className="link text-sm">
                    Forgot your password?
                  </button>
                </InDev>
              </div>
            )}

            <InDev block note="No account behind this form. Nothing is sent and nothing is stored.">
              <button
                type="button"
                aria-disabled="true"
                className="btn btn-primary btn-row auth-submit"
              >
                {creating ? "Create the account" : "Continue"}
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </button>
            </InDev>
          </form>

          <div className="auth-divider">
            <span>Or</span>
          </div>

          <p className="auth-switch-lead">{creating ? "Already have one?" : "No account yet?"}</p>

          <button
            type="button"
            onClick={() => switchTo(creating ? "sign-in" : "create")}
            className="btn btn-quiet btn-row"
          >
            {creating ? "Sign in instead" : "Create an account"}
          </button>

          <p className="caption auth-foot">
            Everything the catalogue itself does — search, filter, compare, shortlist and schedule —
            works signed out.{" "}
            <Link href="/products" className="link">
              Go straight to it
            </Link>
            .
          </p>

          <p className="caption auth-legal">
            Kernbau · a prototype ·{" "}
            <Link href="/about" className="link">
              About
            </Link>
            ,{" "}
            <Link href="/standards" className="link">
              Standards
            </Link>{" "}
            and{" "}
            <Link href="/about#sources" className="link">
              Sources
            </Link>
            <span className="auth-legal-copy">© Kernbau 2026 · Not a real company</span>
          </p>
        </div>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} name={id} type={type} autoComplete={autoComplete} className="field-input" />
      {hint && <p className="caption field-hint">{hint}</p>}
    </div>
  );
}
