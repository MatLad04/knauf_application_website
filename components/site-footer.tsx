import Link from "next/link";
import { Container } from "./section";

const LINKS = [
  { href: "/products", label: "Catalogue" },
  { href: "/applications", label: "Applications" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About the data" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t rule bg-sunken">
      <Container className="grid gap-10 py-14 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-prose">
          <p className="display text-xl">KERNBAU</p>
          <p className="mt-4 text-sm text-muted">
            A fictional manufacturer, invented for a portfolio prototype. Every declared value on
            this site is made up and traceable to no test report, so nothing here is specifiable.{" "}
            <Link href="/about" className="link">
              How the data was built
            </Link>
            .
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="grid gap-2.5 text-sm md:text-right">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-signal">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
