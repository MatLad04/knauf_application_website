import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

type Props = {
  id: string;
  label: string;
  defaultValue?: string;
  /** Carried through so a search from the catalogue keeps the current view. */
  hidden?: Record<string, string>;
  size?: "hero" | "compact";
};

/**
 * A plain GET form, so a search is a real URL that survives a refresh and can
 * be shared. Used in the hero and again at the top of the catalogue, because
 * search is the fastest route to a product on either page.
 */
export default function SearchField({
  id,
  label,
  defaultValue,
  hidden = {},
  size = "hero",
}: Props) {
  const hero = size === "hero";

  return (
    <form action="/products" role="search" className="w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div
        className={`panel flex items-center gap-2 ${hero ? "p-2 pl-5" : "p-1.5 pl-4"} focus-within:ring-2 focus-within:ring-[color:var(--color-signal)]`}
      >
        <MagnifyingGlass
          size={18}
          weight="bold"
          aria-hidden="true"
          className="shrink-0 text-muted"
        />
        <input
          id={id}
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Mineral wool, KB-EPS-031, render"
          className={`min-w-0 flex-1 bg-transparent focus:outline-none placeholder:text-muted ${
            hero ? "py-3 text-base sm:text-lg" : "py-2 text-sm"
          }`}
        />
        <button type="submit" className={`btn btn-primary ${hero ? "" : "px-4 py-2 text-sm"}`}>
          Search
        </button>
      </div>
    </form>
  );
}
