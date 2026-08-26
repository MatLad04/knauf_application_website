import Link from "next/link";
import ThemeToggle from "./theme-toggle";

const NAV = [
  { href: "/products", label: "Catalogue" },
  { href: "/applications", label: "Applications" },
  { href: "/about", label: "Data" },
];

/**
 * One 64px line from `sm` up. Below that the three navigation items cannot
 * share a row with the wordmark without clipping, so they drop to a second
 * row rather than being hidden behind a menu.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b rule bg-[color-mix(in_srgb,var(--color-surface)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[92rem] flex-wrap items-center gap-x-4 px-4 sm:h-16 sm:px-8">
        <Link
          href="/"
          className="display order-1 py-4 text-lg tracking-tight hover:text-signal sm:py-0"
        >
          KERNBAU
        </Link>

        <nav
          aria-label="Main"
          className="order-3 w-full min-w-0 border-t rule pb-1 sm:order-2 sm:ml-auto sm:w-auto sm:border-0 sm:pb-0"
        >
          <ul className="-mx-2.5 flex items-center gap-1 sm:mx-0 sm:gap-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-[var(--radius-control)] px-2.5 py-2 text-sm sm:px-3.5 hover:bg-raised hover:text-signal"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ThemeToggle className="order-2 ml-auto sm:order-3 sm:ml-0" />
      </div>
    </header>
  );
}
