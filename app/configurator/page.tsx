import type { Metadata } from "next";
import { getBuildUp } from "@/lib/catalogue";
import { Container } from "@/components/section";
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
    <Container className="flex min-h-[calc(100svh-var(--header-h))] flex-col pt-5 pb-5">
      {/* The head belongs to the tool rather than to the page: its title is the
          product currently being configured, which only the tool knows. */}
      <WallConfigurator buildUp={buildUp} />
    </Container>
  );
}
