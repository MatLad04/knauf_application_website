import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next writes AGENTS.md and CLAUDE.md into the repo root on first run.
  // Nothing here needs them, and they would ship in the public repository.
  agentRules: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [420, 640, 828, 1080, 1440, 1920],
    imageSizes: [96, 128, 192, 256, 384, 512],
    // A photograph's address carries a hash of its contents (see lib/media.ts),
    // so an address really does always mean the same bytes and its derivatives
    // can be cached for as long as the browser is willing to keep them. Without
    // that hash this line is a trap: replacing a photograph would leave the old
    // one on screen for a year in every browser that had already loaded it.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
};

export default nextConfig;
