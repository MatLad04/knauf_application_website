import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { countProducts } from "@/lib/catalogue";
import { parseProductQuery, productsHref, type RawSearchParams } from "@/lib/params";
import { Container } from "./section";
import { Reveal } from "./motion";

/**
 * The other way in, and the second half of the section above it.
 *
 * The constructions say: start from what you are building. This says the thing
 * that is true at least as often — that a specification arrives as a *figure*.
 * Somebody has been handed a U-value to hit, a Euroclass the building height
 * demands, or a reveal depth that cannot grow, and none of those are a
 * construction. They are constraints, and a constraint is written as an
 * inequality.
 *
 * So the way in is drawn as three inequalities, because that is the form the
 * requirement actually has on the sheet it arrived on: a declared value, an
 * operator and a limit. Each one is a link into the catalogue with that filter
 * already applied, and each carries the count it returns — so the door tells
 * you what is behind it before you open it, and nothing here is a claim the
 * catalogue would not honour.
 *
 * The limits are the three the catalogue is actually asked for most: the
 * conductivity a passive-standard wall needs, the Euroclass that clears every
 * building height, and the depth a reveal will take.
 */

type Door = {
  /** The declared value being constrained, as a datasheet names it. */
  term: string;
  /** Set for a term that is a symbol rather than a word: λ is not Λ. */
  symbol?: boolean;
  /** The constraint itself, written the way a specification writes it. */
  limit: string;
  unit: string;
  /** What it means, in one line, for anyone who does not read Euroclasses. */
  note: string;
  params: RawSearchParams;
};

const DOORS: Door[] = [
  {
    term: "λD",
    symbol: true,
    limit: "≤ 0.035",
    unit: "W/(m·K)",
    note: "The conductivity a thin wall has to hit.",
    params: { lambda_max: "0.035" },
  },
  {
    term: "Reaction to fire",
    limit: "A1",
    unit: "EN 13501-1",
    note: "No contribution to fire, at any height.",
    params: { fire: "A1" },
  },
  {
    term: "Depth",
    limit: "≤ 100",
    unit: "mm",
    note: "What the reveal will take, and no more.",
    params: { thickness_max: "100" },
  },
];

export default async function CatalogueOpening() {
  // Parsed rather than hand-written, so the link and the count are the same
  // filter: a door that says eighteen and opens onto twelve is worse than no
  // door at all.
  const doors = await Promise.all(
    DOORS.map(async (door) => {
      const { query } = parseProductQuery(door.params);
      return { ...door, href: productsHref(query), count: await countProducts(query) };
    }),
  );

  return (
    <section id="catalogue" aria-labelledby="catalogue-heading">
      <Container>
        <div className="opening">
          <div className="opening-head">
            <p className="label">The catalogue</p>
            <p className="label">Every declared value is a filter</p>
          </div>

          <Reveal className="opening-body">
            {/* The argument, on the same three columns the doors below it are
                on: the claim across the first two, the caveat under it on the
                same measure, and the reading in the third — the column the
                third door stands in.

                There is no button. Every door under it is a way into the
                catalogue and each says how many products it opens onto; a
                fourth way in that says "all of them" is the one thing this
                section is arguing against. */}
            <div className="opening-brief">
              <h2 id="catalogue-heading" className="display opening-title">
                Start from the number
              </h2>
              <p className="lead opening-lead max-w-[46ch]">
                A requirement often arrives as a figure: a conductivity to hit, a fire class the
                building height demands, a depth the reveal will take. A figure is a constraint, not
                a product. Each of these is one, already applied.
              </p>
            </div>

            {/* Three constraints, three doors. The rule over each one is the
                same rule the sheet list draws its build-ups with, and it fills
                to the signal when the door is being pointed at. */}
            <ul className="opening-doors">
              {doors.map((door) => (
                <li key={door.term}>
                  <Link href={door.href} className="door">
                    <span className="door-rule" aria-hidden="true" />
                    <span className={`door-term ${door.symbol ? "symbol" : "label"}`}>
                      {door.term}
                    </span>
                    <span className="door-limit mono">
                      {door.limit}
                      <span className="door-unit">{door.unit}</span>
                    </span>
                    <span className="door-note">{door.note}</span>
                    <span className="door-count">
                      {door.count} products
                      <ArrowRight size={14} weight="bold" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
