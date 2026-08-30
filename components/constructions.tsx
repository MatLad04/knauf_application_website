import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Application } from "@/lib/catalogue";
import { CONSTRUCTIONS } from "@/data/constructions";
import ConstructionStage from "./stack/ConstructionStage";
import ConstructionDetail from "./construction-detail";
import SheetIndex from "./sheet-index";
import { Container } from "./section";

type App = Application & { productCount: number };

/**
 * What the stage measures itself against: how far through the five the reader
 * is, and the band it and the words beside it are both pinned under.
 */
const RUN = "constructions-run";
const BANNER = "constructions-banner";

/**
 * The constructions, and the argument for why they are the way in.
 *
 * This was a page of its own, and the landing page made its argument without
 * the evidence — a claim about build-ups above the fold and the five actual
 * build-ups behind a navigation item most visitors never opened. It is one
 * section now: the title, the sheet list, and then the five constructions.
 *
 * They are not five sheets any more. A sheet each meant five photographs, and a
 * photograph of a wall shows you a wall — it cannot show you that the wall is
 * seven things in a fixed order, which is the only claim this section exists to
 * make. So the five share one drawing: a stack of layers, labelled, that the
 * camera goes round once per construction and that becomes the next
 * construction rather than being replaced by it. The words scroll; the drawing
 * is pinned beside them and turns as they go past.
 *
 * `/applications` still resolves; it redirects here, because the URL was
 * shareable and the sitemap had it.
 */
export default function Constructions({ applications }: { applications: App[] }) {
  return (
    <section id="applications" aria-labelledby="constructions-heading">
      <Container>
        <div className="constructions">
          {/* The banner: what the section is, and the register of what is in
              it, as one band that stays at the top of the screen for the whole
              run. The five constructions go past underneath it, so the claim
              they are evidence for is still on the page while you are reading
              them — and the line of the register belonging to the one you are
              looking at is marked, so you always know which of the five you
              are in. */}
          <div id={BANNER} className="constructions-banner">
            <div className="constructions-head">
              <div className="constructions-head-grid">
                <div className="sm:col-span-2">
                  <p className="label">Applications</p>
                  <h2
                    id="constructions-heading"
                    className="display mt-5 max-w-[24ch] text-[clamp(2.25rem,5vw,4rem)] leading-[0.98]"
                  >
                    Walls, roofs and floors, layer by layer
                  </h2>
                </div>

                <p className="lead sm:col-start-1">
                  Each construction below is drawn as the build-up it is approved as, in
                  installation order, with every Kernbau product approved for it one click away.
                </p>
                <p className="text-sm leading-relaxed text-muted sm:col-start-2">
                  The order matters as much as the products in it: a system is assessed as a whole
                  under ETAG 004, the European approval route for these build-ups, so a layer
                  swapped for an equivalent-looking one is a different system — which is why the
                  catalogue filters by construction and not only by material.
                </p>
              </div>
            </div>

            <SheetIndex applications={applications} />
          </div>

          {/* The run: the words in one column and the drawing in the other,
              both pinned under the banner for the length of the five. The stage
              measures this element to know how far through them it is, so the
              id is load-bearing. */}
          <div id={RUN} className="constructions-run">
            <div className="constructions-copy">
              {applications.map((application) => (
                <ConstructionCopy key={application.slug} application={application} />
              ))}
              {/* A beat on the last construction before the section ends. */}
              <div className="constructions-close" aria-hidden="true" />
            </div>

            <div className="constructions-stage-col">
              <ConstructionStage runId={RUN} bannerId={BANNER} />
              <NoScriptFigure />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * One construction, in words.
 *
 * The layer list that used to be here is in the drawing now, on leaders, where
 * a name sits against the thickness it names instead of against a rule standing
 * in for it. What is left is the part a drawing cannot say: what the system is,
 * why it is specified as one thing rather than as seven articles, and what
 * decides between the materials it can be built from.
 *
 * The id is what the sheet list watches to know which line to mark, and it is
 * the same id `/applications` has always redirected to.
 */
function ConstructionCopy({ application }: { application: App }) {
  const drawn = CONSTRUCTIONS.find((c) => c.id === application.slug);

  return (
    <article id={`app-${application.slug}`} className="constructions-block">
      {/* Pinned under the banner for as long as its construction is on the
          stage, so the words and the drawing they describe are on screen at the
          same time and neither has to be scrolled back to. */}
      <div className="constructions-copy-inner">
        <div className="flex items-baseline gap-5">
          <span className="mono text-sm text-muted">
            {String(application.indexNo).padStart(2, "0")}
          </span>
          <h3 className="display text-[clamp(1.75rem,4vw,3rem)]">{application.name}</h3>
        </div>

        <p className="mt-5 max-w-[52ch] text-lg text-muted">{application.summary}</p>

        <p className="mt-6 max-w-[54ch] text-base leading-relaxed">{application.description}</p>

        {/* Below the width that holds the turning stack, the construction is
            drawn here instead, flat and in section. One of the two is always
            on the page and never both. */}
        {drawn ? <ConstructionDetail construction={drawn} /> : null}

        <p className="mono mt-7 text-xs text-muted">
          {application.buildUp.length} layers
          {drawn
            ? ` · ${drawn.layers.reduce((mm, l) => mm + l.thicknessMm, 0)} mm overall`
            : ""} · {application.productCount} products approved
        </p>

        <Link href={`/products?application=${application.slug}`} className="btn btn-primary mt-6">
          All {application.productCount} approved products
          <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

/**
 * What the stage is, without the script that turns it.
 *
 * The drawing is scroll-driven, and scroll-driven means JavaScript: there is no
 * declarative way to project a leader onto a rotating solid. So the layers are
 * also written out as a list, inside a `<noscript>`, which is the same content
 * the callouts carry and the thing a reader without the drawing actually needs.
 */
function NoScriptFigure() {
  return (
    <noscript>
      <div className="constructions-fallback">
        {CONSTRUCTIONS.map((construction) => (
          <div key={construction.id}>
            <p className="label">
              {construction.index} · {construction.title}
            </p>
            <ol className="mt-2">
              {construction.layers.map((layer, i) => (
                <li key={layer.id} className="flex gap-4 border-b rule py-2 text-sm">
                  <span className="mono w-6 shrink-0 text-xs text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{layer.name}</span>
                  <span className="mono ml-auto text-xs text-muted">
                    {layer.thicknessMm > 0 ? `${layer.thicknessMm} mm` : "—"}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </noscript>
  );
}
