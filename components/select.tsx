"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, CaretDown } from "@phosphor-icons/react/dist/ssr";

export type Option = { value: string; label: string; hint?: string };

/**
 * The one dropdown on the site.
 *
 * A native `<select>` is the only control a browser refuses to let a page
 * style: the list that drops out of it is drawn by the operating system, in the
 * system's own blue, at the system's own size, with the system's own tick. On a
 * page this quiet it arrives as a piece of someone else's software — and on a
 * catalogue where every option is a declared value in a mono figure, it also
 * loses the one thing that makes the options comparable.
 *
 * So the list is drawn here instead: same rules, same radius, same mono
 * figures as the schedule the values come from. It is a listbox rather than a
 * menu, because that is what it is — one value, chosen from a set — and it
 * carries the keyboard behaviour that goes with one: arrows to move, Home and
 * End to jump, Enter or Space to take it, Escape to leave it alone.
 *
 * Before hydration it renders the native control it replaces, so the filter
 * form is still a working form with no JavaScript at all. The swap happens on
 * mount, which is also the moment the rest of this panel stops being a form and
 * starts being an interface.
 */
export default function Select({
  name,
  value,
  options,
  onChange,
  label,
  mono,
  align = "start",
  className = "",
}: {
  /** Set on a hidden input so the control still posts inside a plain form. */
  name?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** Accessible name, when there is no visible `<label>` pointing at this. */
  label?: string;
  mono?: boolean;
  align?: "start" | "end";
  className?: string;
}) {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  // Where the keyboard is, which is not where the value is until it is taken.
  const [cursor, setCursor] = useState(0);

  useEffect(() => setMounted(true), []);

  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[index];

  // Opening puts the cursor on the current value, so the list starts where the
  // control already is rather than at the top of a set you did not choose.
  useEffect(() => {
    if (open) setCursor(index);
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[data-cursor="true"]')?.scrollIntoView({
      block: "nearest",
    });
  }, [open, cursor]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const take = (next: string) => {
    setOpen(false);
    button.current?.focus();
    if (next !== value) onChange(next);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const move = (to: number) => {
      event.preventDefault();
      if (!open) setOpen(true);
      setCursor(Math.min(options.length - 1, Math.max(0, to)));
    };

    switch (event.key) {
      case "ArrowDown":
        return move(open ? cursor + 1 : index);
      case "ArrowUp":
        return move(open ? cursor - 1 : index);
      case "Home":
        return move(0);
      case "End":
        return move(options.length - 1);
      case "Escape":
        if (!open) return;
        event.preventDefault();
        setOpen(false);
        return;
      case "Enter":
      case " ": {
        event.preventDefault();
        if (!open) return setOpen(true);
        const option = options[cursor];
        if (option) take(option.value);
        return;
      }
      default:
        return;
    }
  };

  // Until hydration the real control is the native one, so the panel this sits
  // in is a form that works with the script blocked or still on its way.
  if (!mounted) {
    return (
      <select
        name={name}
        aria-label={label}
        defaultValue={value}
        onChange={(event) => onChange(event.target.value)}
        className={`control ${mono ? "mono" : ""} px-3 py-2 text-sm ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div ref={wrap} className={`dropdown ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}

      <button
        ref={button}
        type="button"
        role="combobox"
        aria-controls={`${id}-list`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        data-open={open ? "true" : undefined}
        onClick={() => setOpen((was) => !was)}
        onKeyDown={onKeyDown}
        className={`control dropdown-button ${mono ? "mono" : ""}`}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <CaretDown size={13} weight="bold" aria-hidden="true" className="dropdown-caret" />
      </button>

      {open && (
        <div
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${id}-${cursor}`}
          data-align={align}
          className="dropdown-list"
          onKeyDown={onKeyDown}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                id={`${id}-${i}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-cursor={i === cursor ? "true" : undefined}
                data-selected={isSelected ? "true" : undefined}
                onPointerEnter={() => setCursor(i)}
                onClick={() => take(option.value)}
                className={`dropdown-option ${mono ? "mono" : ""}`}
              >
                <Check
                  size={13}
                  weight="bold"
                  aria-hidden="true"
                  className="dropdown-tick shrink-0"
                />
                <span className="flex-1 truncate text-left">{option.label}</span>
                {option.hint && <span className="caption shrink-0">{option.hint}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
