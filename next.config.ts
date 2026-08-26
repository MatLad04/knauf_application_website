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
    // Source images never change, so optimised derivatives can be cached hard.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
};

export default nextConfig;
