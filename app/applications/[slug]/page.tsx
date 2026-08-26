import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getApplicationBySlug, listProducts } from "@/lib/catalogue";
import { applicationImage } from "@/lib/media";
import { parseProductQuery } from "@/lib/params";
import ProductCard from "@/components/product-card";
import { Container } from "@/components/section";
import { Reveal } from "@/components/motion";

// Rendered per request: the catalogue lives in Postgres, which does not exist
// at build time inside Docker.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const application = await getApplicationBySlug((await params).slug);
  if (!application) return { title: "Application not found" };

  return {
    title: application.name,
    description: application.summary,
    alternates: { canonical: `/applications/${application.slug}` },
  };
}

export default async function ApplicationPage({ params }: Props) {
  const { slug } = await params;
  const application = await getApplicationBySlug(slug);
  if (!application) notFound();

  // Same query the catalogue runs, pre-filtered to this application.
  const { query } = parseProductQuery({ application: slug });
  const page = await listProducts({ ...query, perPage: 8 });
  const image = applicationImage(application.imageKey);

  return (
    <>
      <Container className="py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="label flex flex-wrap items-center gap-1.5">
          <Link href="/applications" className="hover:text-signal">
            Applications
          </Link>
          <CaretRight size={10} weight="bold" aria-hidden="true" />
          <span>{application.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
          <div>
            <h1 className="display text-[clamp(2rem,4.5vw,3.25rem)]">{application.name}</h1>
            <p className="mt-6 max-w-[58ch] text-lg text-muted">{application.description}</p>
            <Link
              href={`/products?application=${application.slug}`}
              className="btn btn-primary group mt-8"
            >
              All {page.total} approved products
              <ArrowRight
                size={16}
                weight="bold"
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className="media aspect-[4/3] lg:aspect-auto lg:min-h-72">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 30rem"
              className="texture object-cover"
              priority
            />
          </div>
        </div>
      </Container>

      <section aria-labelledby="buildup-heading" className="border-t rule bg-sunken">
        <Container className="grid gap-10 py-16 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <h2 id="buildup-heading" className="display text-[clamp(1.625rem,3.2vw,2.5rem)]">
            Layer order
          </h2>
          <ol>
            {application.buildUp.map((layer, i) => (
              <li
                key={layer}
                className="flex items-baseline gap-5 border-b rule py-4 first:border-t"
              >
                <span className="mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg">{layer}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="products-heading" className="border-t rule">
        <Container className="py-16">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <h2 id="products-heading" className="display text-[clamp(1.625rem,3.2vw,2.5rem)]">
                Where to start
              </h2>
              <Link
                href={`/products?application=${application.slug}`}
                className="btn btn-quiet group"
              >
                See all {page.total}
                <ArrowRight
                  size={16}
                  weight="bold"
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {page.products.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
