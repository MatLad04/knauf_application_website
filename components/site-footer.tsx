import Link from "next/link";
import { ArrowUp } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./section";

/**
 * The last informative block on every page rather than a list of links.
 *
 * It opens with the way back up, states what this catalogue is measured in —
 * the equivalent of a country and language, and the thing that decides whether
 * a declared value means anything to you — and closes on the standards the data
 * is shaped by. The honesty note is at the foot, where a legal line goes,
 * because that is exactly what it is.
 */
const COLUMNS = [
  {
    title: "The catalogue",
    links: [
      { href: "/products", label: "All products" },
      { href: "/applications", label: "Applications" },
      { href: "/compare", label: "Compare products" },
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

const STANDARDS = ["EN 13501-1", "EN 13162", "EN ISO 6946", "ETAG 004", "EU 305/2011"];

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t rule bg-sunken">
      {/* Back to the top, centred and on its own, the way a long page ends. */}
      <div className="border-b rule">
        <Container className="py-6 text-center">
          <a href="#main" className="group inline-flex flex-col items-center gap-2.5 text-sm">
            <ArrowUp
              size={18}
              weight="bold"
              aria-hidden="true"
              className="transition-transform group-hover:-translate-y-0.5"
            />
            Back to top
          </a>
        </Container>
      </div>

      <Container className="py-11 sm:py-12">
        {/* Four columns, and the first one is what the numbers on this site
            are in: the declared-value equivalent of a country and a language,
            and without it none of them mean anything. It shares the row rather
            than taking one of its own, which is most of the height. */}
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

        {/* Where a real manufacturer would put social icons and app stores, a
            fictional one puts the standards its data is shaped by. */}
        <div className="mt-11 flex flex-wrap items-center gap-2 border-t rule pt-7">
          <span className="label mr-2">Declared against</span>
          {STANDARDS.map((standard) => (
            <span key={standard} className="chip mono text-[0.6875rem] text-muted">
              {standard}
            </span>
          ))}
        </div>

        {/* The wordmark signs off the page, centred, the way a sheet is signed
            at the foot of the frame. */}
        <p className="display mt-10 text-center text-xl tracking-tight">KERNBAU</p>
      </Container>
    </footer>
  );
}
