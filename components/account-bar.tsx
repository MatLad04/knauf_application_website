"use client";

import Link from "next/link";
import { Basket, Heart, User } from "@phosphor-icons/react";
import { useCartCount, useSaved } from "@/lib/store";

/**
 * The account side of the bar.
 *
 * The two lists it points at are kept in the browser, and the bar is on every
 * page — so the figures have to be live. Adding a board on the catalogue moves
 * the number in the bar without a navigation, which is the whole reason this
 * strip is a client component while the rest of the header is not.
 *
 * The counts render as nothing on the first pass. The server has no way of
 * knowing what is in a browser's storage, so a figure drawn before the store is
 * read would be a figure that changes under the reader a frame later; the badge
 * arrives with the number rather than correcting itself.
 */
export default function AccountBar() {
  const savedCount = useSaved().length;
  const cartCount = useCartCount();

  const items = [
    { href: "/sign-in", icon: User, label: "Sign in", text: true, count: 0 },
    { href: "/favourites", icon: Heart, label: "Favourites", count: savedCount },
    { href: "/cart", icon: Basket, label: "Basket", count: cartCount },
  ];

  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="account-act flex items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm hover:bg-raised hover:text-signal sm:px-2.5"
        >
          <span className="account-glyph">
            <item.icon size={20} aria-hidden="true" />
            {item.count > 0 && (
              <span className="account-count mono" aria-hidden="true">
                {item.count > 99 ? "99+" : item.count}
              </span>
            )}
          </span>
          <span className={item.text ? "hidden whitespace-nowrap xl:inline" : "sr-only"}>
            {item.label}
            {item.count > 0 ? `, ${item.count}` : ""}
          </span>
        </Link>
      ))}
    </>
  );
}
