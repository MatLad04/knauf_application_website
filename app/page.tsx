import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getApplications, getCatalogueStats, getCategories, getSampleWall } from "@/lib/catalogue";
import { applicationImage, HERO_IMAGE, texture } from "@/lib/media";
import { lambda } from "@/lib/format";
import ProductCard from "@/components/product-card";
import SearchField from "@/components/search-field";
import { Container, SectionHead } from "@/components/section";
import { Enter, Reveal } from "@/components/motion";

// Rendered per request: the catalogue lives in Postgres, which does not exist
// at build time inside Docker.
export const dynamic = "force-dynamic";

const BUILD_UP = [
  "Adhesive mortar",
  "Insulation board",
  "Mechanical anchor",
  "Base coat",
  "Reinforcement mesh",
  "Primer",
  "Thin-coat render",
];

export default async function HomePage() {
  const [stats, categories, applications, wall] = await Promise.all([
    getCatalogueStats(),
    getCategories(),
    getApplications(),
    getSampleWall(8),
  ]);

  return (
    <>
      <Hero stats={stats} />

      {/* Browse by what the product is made of. A rail rather than a grid,
          because seven categories are a shelf, not a page. */}
      <section aria-labelledby="categories-heading" className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHead
              id="categories-heading"
              title="Browse by material"
              lead="Seven product categories, each with its own declared characteristics and its own reason for being chosen."
            />
          </Reveal>
        </Container>

        <Reveal className="mt-10">
          <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:gap-6 sm:px-8 [scrollbar-width:thin]">
            {categories.map((category) => {
              const image = texture(category.textureKey);
              return (
                <li key={category.slug} className="w-[70vw] shrink-0 snap-start sm:w-72">
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="card group relative block"
                  >
                    <div className="media aspect-[3/4]">
                      <Image
                        src={image.src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 70vw, 18rem"
                        className="texture object-cover"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-3 pt-4">
                      <h3 className="font-medium group-hover:text-signal">{category.name}</h3>
                      <span className="mono text-[0.6875rem] text-muted">
                        {category.productCount}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{category.summary}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </section>

      {/* The products themselves. One per material family, so the grid shows
          the range of the catalogue rather than eight variants of one board. */}
      <section aria-labelledby="products-heading" className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHead
              id="products-heading"
              title="One product from each family"
              lead="Every variant of a board shares a datasheet and a photograph. Thickness and declared conductivity are what separate them."
              href="/products"
              hrefLabel={`All ${stats.products} products`}
            />
          </Reveal>

          <Reveal className="mt-12">
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
              {wall.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* The second way in: start from the construction you are detailing. */}
      <section aria-labelledby="applications-heading" className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
            <Reveal>
              <h2 id="applications-heading" className="display text-[clamp(1.75rem,3.6vw,2.75rem)]">
                Or start from the situation
              </h2>
              <p className="mt-4 text-muted">
                Most specification decisions begin with a construction, not a catalogue. Pick the
                one you are detailing and the list narrows to what is approved for it.
              </p>
              <Link href="/applications" className="btn btn-quiet group mt-8">
                All applications
                <ArrowRight
                  size={16}
                  weight="bold"
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </Reveal>

            <Reveal>
              <ul>
                {applications.map((application) => {
                  const image = applicationImage(application.imageKey);
                  return (
                    <li key={application.slug} className="border-b rule first:border-t">
                      <Link
                        href={`/applications/${application.slug}`}
                        className="group flex items-center gap-5 py-5 hover:text-signal"
                      >
                        <span className="media aspect-square w-16 shrink-0 sm:w-20">
                          <Image
                            src={image.src}
                            alt=""
                            fill
                            sizes="80px"
                            className="texture object-cover"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{application.name}</span>
                          <span className="mt-1 block text-sm text-muted">
                            {application.summary}
                          </span>
                        </span>
                        <span className="mono shrink-0 text-xs text-muted">
                          {application.productCount}
                        </span>
                        <ArrowRight
                          size={16}
                          weight="bold"
                          aria-hidden="true"
                          className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-signal"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Why the catalogue is shaped as systems rather than as isolated items. */}
      <section aria-labelledby="systems-heading" className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <div className="media aspect-[16/10] max-h-[34rem] sm:aspect-[21/9]">
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fill
                sizes="(max-width: 1536px) 100vw, 92rem"
                className="texture object-cover"
              />
            </div>
          </Reveal>

          <Reveal className="mt-12">
            <h2 id="systems-heading" className="display text-[clamp(1.75rem,3.6vw,2.75rem)]">
              A board is one layer of seven
            </h2>
            <p className="mt-4 max-w-[58ch] text-muted">
              An insulation board is never installed alone, and it is approved as part of a build-up
              rather than on its own. Every product page carries the system it belongs to, in
              installation order.
            </p>

            <ol className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 lg:grid-cols-7">
              {BUILD_UP.map((layer, i) => (
                <li key={layer} className="border-t-2 border-ink pt-3">
                  <span className="mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mt-1 block text-sm font-medium">{layer}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </Container>
      </section>

      {/* The honesty note. Narrow and centred, because it is a statement and
          not a feature. */}
      <section className="pb-24 pt-8 sm:pb-32">
        <Container>
          <Reveal className="mx-auto max-w-[46rem] border-t rule pt-12 text-center">
            <h2 className="display text-[clamp(1.5rem,3vw,2.25rem)]">
              Invented products, real specification framework
            </h2>
            <p className="mt-5 text-muted">
              Kernbau does not exist. Every declared value here is made up and backed by no test
              report. The units, standards and document formats are the ones a real datasheet uses,
              so the interface can be judged honestly.
            </p>
            <Link href="/about" className="btn btn-quiet group mt-8">
              How the data was built
              <ArrowRight
                size={16}
                weight="bold"
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

function Hero({
  stats,
}: {
  stats: { products: number; categories: number; applications: number; bestLambda: number | null };
}) {
  return (
    <section className="pb-4">
      <Container className="pt-14 pb-12 text-center sm:pt-20 sm:pb-16">
        <Enter>
          <h1 className="display text-[clamp(2.5rem,6.5vw,4.75rem)]">Every layer, declared</h1>
        </Enter>
        <Enter delay={0.1} className="mx-auto mt-6 max-w-[56ch]">
          <p className="text-lg text-muted sm:text-xl">
            Insulation, reinforcement and render systems, searchable on the values a Declaration of
            Performance actually carries.
          </p>
        </Enter>
        <Enter delay={0.2} className="mx-auto mt-9 w-full max-w-2xl">
          <SearchField id="hero-search" label="Search the catalogue" />
        </Enter>
      </Container>

      {/* The photograph is the object; the page ground holds the type. Cropped
          wide so it reads as a stage rather than as a card. */}
      <Enter delay={0.3}>
        <Container>
          {/* Held to a stage width rather than run full bleed: the photograph
              is a square object, and a wide crop would cut the layers off. */}
          <div className="media mx-auto aspect-[4/3] w-full max-w-3xl">
            <Image
              src={HERO_IMAGE.src}
              alt={HERO_IMAGE.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 48rem"
              className="texture object-cover object-center"
            />
          </div>
        </Container>
      </Enter>

      <Container>
        <dl className="mt-12 grid grid-cols-2 gap-x-6 sm:grid-cols-4">
          <Stat term="Products" value={stats.products} />
          <Stat term="Categories" value={stats.categories} />
          <Stat term="Applications" value={stats.applications} />
          <Stat
            term={<span className="symbol">Lowest λD</span>}
            value={lambda(stats.bestLambda) ?? "n/a"}
            unit="W/(m·K)"
          />
        </dl>
      </Container>
    </section>
  );
}

function Stat({
  term,
  value,
  unit,
}: {
  term: React.ReactNode;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="border-t-2 border-ink pt-3">
      <dt className="label">{term}</dt>
      <dd className="mono mt-1.5 text-2xl sm:text-3xl">
        {value}
        {unit && <span className="caption ml-2">{unit}</span>}
      </dd>
    </div>
  );
}
