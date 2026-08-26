"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("kernbau-theme", next);
    setTheme(next);
  }

  const Icon = theme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`control grid size-9 shrink-0 place-items-center ${className}`}
      aria-pressed={theme === "dark"}
    >
      <span className="sr-only">Dark theme</span>
      <Icon size={16} weight="bold" aria-hidden="true" />
    </button>
  );
}
