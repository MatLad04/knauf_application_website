"use client";

import { Basket, Heart } from "@phosphor-icons/react";
import { cart, saved, useSaved } from "@/lib/store";
import { release } from "@/lib/release";

type Props = {
  slug: string;
  name: string;
  /** `card` is the pair under a product card; `page` is the pair on a product. */
  variant?: "card" | "page";
};

/**
 * The two things a specifier does with a product they have decided on: keep it,
 * and ask what it costs. They used to be links to a page apologising for not
 * existing; they are now the controls they are drawn as.
 *
 * Only one of them is a switch, and only that one shows a state. Saving is
 * reversible where it stands — the heart fills, the word changes to "Saved",
 * and pressing it again takes it back off — so the card can afford to say so.
 * The basket is not: a second click is a second board, and there is no way to
 * take one off from here. A figure you cannot argue with is a figure in the
 * wrong place, so the running count lives where it can be changed — in the bar,
 * and on the schedule itself.
 */
export default function ProductActs({ slug, name, variant = "card" }: Props) {
  const shortlist = useSaved();
  const isSaved = shortlist.includes(slug);

  const page = variant === "page";
  const size = page ? 16 : 15;

  // The card's pair sit inside the card's own full-area link, so their click
  // must never reach it and open the product instead of doing the thing.
  const stop = (run: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    run();
  };

  return (
    <div className={page ? "contents" : "card-acts"}>
      <button
        type="button"
        onPointerUp={release}
        onClick={stop(() => saved.toggle(slug))}
        aria-pressed={isSaved}
        data-active={isSaved ? "true" : undefined}
        className={page ? "btn btn-primary" : "card-act"}
      >
        <Heart size={size} weight={isSaved ? "fill" : "bold"} aria-hidden="true" />
        {isSaved ? "Saved" : "Save"}
        <span className="sr-only"> {name}</span>
      </button>

      <button
        type="button"
        onPointerUp={release}
        onClick={stop(() => cart.add(slug))}
        className={page ? "btn btn-quiet" : "card-act"}
      >
        <Basket size={size} weight="bold" aria-hidden="true" />
        {page ? "Add to basket" : "Basket"}
        <span className="sr-only"> {name}</span>
      </button>
    </div>
  );
}
