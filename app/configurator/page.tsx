import type { Metadata } from "next";
import { getBuildUp } from "@/lib/catalogue";
import { Container } from "@/components/section";
import { Enter } from "@/components/motion";
import WallConfigurator from "@/components/wall-configurator";

// Rendered per request: the catalogue lives in Postgres, which does not exist
// at build time inside Docker.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wall configurator",
  description:
    "Choose a substrate, a board, a depth and a finish, and read the depth, the U-value and the reaction to fire the build-up reaches. An external wall insulation system, drawn to scale as you configure it.",
  alternates: { canonical: "/configurator" },
};

/**
 * A tool, so it is laid out as one: a short head, then a stage that takes the
 * rest of the screen and does not end in anything else. The page finishes on
 * the summary — there is no footnote section after it, because the next thing
 * after finishing a build-up is doing something with it, not reading on.
 */
export default async function ConfiguratorPage() {
  const buildUp = await getBuildUp();

  return (
    <Container className="pt-5 pb-10 sm:pt-6">
      <Enter className="config-head">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="label">Configurator</p>
          <p className="mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
            External wall · ETICS · trial
          </p>
        </div>

        <h1 className="display config-title mt-2">Build the wall, read the number</h1>

        <p className="mt-2 max-w-[70ch] text-sm text-muted">
          Depth and U-value belong to the build-up, not to any board in it — four decisions, and the
          section redraws to scale as you make them.
        </p>
      </Enter>

      <WallConfigurator buildUp={buildUp} />
    </Container>
  );
}
