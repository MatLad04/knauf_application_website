"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The main navigation, and the one thing in the bar that has to know where you
 * are.
 *
 * The page you are on is marked the way this site marks a selection everywhere
 * else — in signal, against a ruled edge. On a tile that edge is struck down
 * the leading side; on a bar it is struck along the foot, which is where a set
 * of tabs carries it, so the mark reads as "this sheet is open" rather than as
 * one more hover state.
 */
export default function SiteNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="order-4 w-full min-w-0 lg:order-2 lg:w-auto">
      <ul className="-mx-2.5 flex items-center gap-1 lg:mx-0">
        {items.map((item) => {
          // A section rather than a page: /products/kernlan-fs-032 is still
          // Products, and the bar should say so.
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : undefined}
                className="nav-link"
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
