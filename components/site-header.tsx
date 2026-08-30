import { Suspense } from "react";
import { texture } from "@/lib/media";
import Link from "next/link";
import { getApplications, getCategories, getFamilies, getShowcase } from "@/lib/catalogue";
import { lambda } from "@/lib/format";

import { Basket, Heart, User } from "@phosphor-icons/react/dist/ssr";
import SiteNav from "./site-nav";
import ThemeToggle from "./theme-toggle";
import SiteSearch, { type SearchLane } from "./site-search";

/**
 * The same three layers as the favicon — render, insulation, substrate — cut to
 * a section through a wall. It is drawn in `currentColor` rather than in the
 * favicon's fixed greys so it belongs to whichever theme is on and turns with
 * the wordmark on hover, and the layers keep the favicon's proportions so the
 * tab and the bar are recognisably the same mark.
 */
function Logomark() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="logomark shrink-0 rounded-[5px]"
    >
      <rect width="32" height="32" fill="currentColor" />
      <g fill="var(--color-surface)">
        <rect x="6" y="7" width="20" height="4" />
        <rect x="6" y="13" width="20" height="7" opacity="0.55" />
        <rect x="6" y="22" width="20" height="4" opacity="0.8" />
      </g>
    </svg>
  );
}

const NAV = [
  { href: "/products", label: "Products" },
  { href: "/configurator", label: "Configurator" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
];

/**
 * The account side of the bar. None of it is built — a prototype about choosing
 * a product has no reason to hold a basket — so each one says so on its own
 * page rather than being a control that does nothing.
 */
const ACCOUNT = [
  { href: "/in-development?feature=account", icon: User, label: "Sign in", text: true },
  { href: "/in-development?feature=favourites", icon: Heart, label: "Favourites" },
  { href: "/in-development?feature=basket", icon: Basket, label: "Basket" },
];

/** Four starts for someone who knows a requirement but not a product name. */
const SHORTCUTS = [
  { label: "Euroclass A1", href: "/products?fire=A1" },
  { label: "λD ≤ 0.032", href: "/products?lambda_max=0.032" },
  { label: "Under screed", href: "/products?application=floor&thickness_min=50" },
  { label: "With an EPD", href: "/products?epd=1" },
];

/**
 * One bar, on every page, and it does not move. The catalogue is the thing this
 * site does, so the search sits in the furniture rather than on a page of its
 * own: the same field is there whether you are reading about a build-up or
 * looking at 74 results, and the body under it is what changes.
 */
export default async function SiteHeader() {
  const [categories, families, applications, showcase] = await Promise.all([
    getCategories(),
    getFamilies(7),
    getApplications(),
    getShowcase(6),
  ]);

  const lanes: SearchLane[] = [
    {
      title: "Materials",
      rows: categories.map((category) => ({
        label: category.name,
        count: category.productCount,
        href: `/products?category=${category.slug}`,
      })),
    },
    {
      title: "Families",
      rows: families.map((family) => ({
        label: family.name,
        count: family.productCount,
        href: `/products?q=${encodeURIComponent(family.name)}`,
      })),
    },
    {
      title: "Applications",
      rows: applications.map((application) => ({
        label: application.name,
        count: application.productCount,
        href: `/products?application=${application.slug}`,
      })),
    },
  ];

  // What the panel offers before a word is typed: the terms someone in this
  // trade actually searches, and the six products with the lowest declared
  // conductivity, which is the figure most searches are really about.
  const suggestions = [
    ...categories.slice(0, 4).map((category) => category.name),
    ...families.slice(0, 3).map((family) => family.name),
  ];

  const products = showcase.map((product) => ({
    name: product.name,
    code: product.code,
    href: `/products/${product.slug}`,
    image: texture(product.textureKey).src,
    figure: lambda(product.thermalConductivity) ?? "n/a",
    unit:
      (product.thicknessMm === null ? product.variantLabel : `${product.thicknessMm} mm`) ?? "—",
  }));

  return (
    <header className="site-bar sticky top-0 z-50 border-b rule bg-surface">
      <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5 sm:px-8 lg:h-[5.5rem] lg:flex-nowrap lg:gap-x-8 lg:px-12 lg:py-0 xl:px-16 2xl:px-20">
        <Link
          href="/"
          aria-label="Kernbau, home"
          className="wordmark display order-1 flex shrink-0 items-center gap-2.5 text-lg tracking-tight hover:text-signal lg:text-[1.4rem]"
        >
          <Logomark />
          KERNBAU
        </Link>

        <SiteNav items={NAV} />

        {/* The search takes the middle and every pixel the rest of the bar is
            not using. It used to stop at 44rem, and on a wide screen the row
            then ran out of content before it ran out of bar: the leftover
            collected after the last item as a band of empty header. The field
            is the right thing to spend it on — it is the control this site is
            for. */}
        <div className="order-3 w-full min-w-0 lg:order-3 lg:mx-2 lg:w-auto lg:flex-1">
          <Suspense fallback={<div className="search-bar h-[3.25rem]" />}>
            <SiteSearch
              lanes={lanes}
              shortcuts={SHORTCUTS}
              suggestions={suggestions}
              products={products}
            />
          </Suspense>
        </div>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-1 lg:order-4 lg:ml-0 lg:gap-2">
          {ACCOUNT.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm hover:bg-raised hover:text-signal sm:px-2.5"
            >
              <item.icon size={20} aria-hidden="true" />
              <span className={item.text ? "hidden whitespace-nowrap xl:inline" : "sr-only"}>
                {item.label}
              </span>
            </Link>
          ))}

          <ThemeToggle className="ml-1" />
        </div>
      </div>
    </header>
  );
}
