import Link from "next/link";
import { STANDARDS } from "@/lib/standards";
import { ArrowUp } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./section";

/**
 * The last informative block on every page rather than a list of links.
 *
 * Four columns, and the first of them is the one a catalogue like this owes its
 * reader before any link: what the numbers on this site are in. It shares the
 * row rather than taking one of its own, which is most of the height.
 *
 * Under the rule is the sign-off, in two lines. The first states what the data
 * is declared against — a rail of references, because a reference is a token
 * you cite rather than a sentence you read — with the way back up at the far
 * end of it. The wordmark closes underneath, at the left edge every other line
 * in the footer starts at.
 */
const COLUMNS = [
  {
    title: "The catalogue",
    links: [
      { href: "/products", label: "All products" },
      { href: "/#applications", label: "Applications" },
      { href: "/compare", label: "Compare products" },
      { href: "/configurator", label: "Wall configurator" },
      { href: "/products?epd=1", label: "Products with an EPD" },
      { href: "/products?fire=A1", label: "Euroclass A1 products" },
    ],
  },
  {
    title: "The company",
    links: [
      { href: "/services", label: "Services" },
      { href: "/about", label: "About Kernbau" },
      { href: "/about#sources", label: "Sources consulted" },
      { href: "/about", label: "Limitations" },
    ],
  },
  {
    title: "Documents",
    links: [
      { href: "/about", label: "Declarations of Performance" },
      { href: "/about", label: "Environmental declarations" },
      { href: "/about", label: "Technical datasheets" },
      { href: "/about", label: "How the data was built" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t rule bg-sunken">
      <Container className="py-11 sm:py-12">
        {/* Four columns. The first says what the numbers on this site are in
            — the declared-value equivalent of a country and a language — and
            the three after it are the site. */}
        <div className="grid gap-x-12 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="lane-title inline-block">Units and market</p>
            <p className="mt-4 grid gap-1.5 text-sm">
              <span>
                <span className="mono">SI</span> — metric, W/(m·K) and mm
              </span>
              <span>European Union</span>
              <Link href="/about" className="link">
                Why it matters
              </Link>
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="lane-title inline-block">{column.title}</p>
              <ul className="mt-4 grid gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm hover:text-signal">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* The sign-off. The references and the way back up share a line —
            the last thing the data is answerable to at one end, the way out at
            the other — and the wordmark closes underneath them, starting at the
            same left edge every other line in the footer starts at. */}
        <div className="mt-12 border-t rule pt-8">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/standards" className="label mr-2 hover:text-signal">
                Declared against
              </Link>
              {STANDARDS.map((standard) => (
                <Link
                  key={standard.slug}
                  href={`/standards/${standard.slug}`}
                  className="chip mono text-[0.6875rem]"
                >
                  {standard.reference}
                </Link>
              ))}
            </div>

            <a
              href="#main"
              className="group inline-flex shrink-0 items-center gap-2 text-sm hover:text-signal"
            >
              <ArrowUp
                size={16}
                weight="bold"
                aria-hidden="true"
                className="transition-transform group-hover:-translate-y-0.5"
              />
              Back to top
            </a>
          </div>

          <p className="display t-section mt-9 tracking-tight">KERNBAU</p>
        </div>
      </Container>
    </footer>
  );
}
