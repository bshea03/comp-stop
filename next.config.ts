import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Serve marketplace CDN URLs as-is (no Vercel Image Optimization / transformations).
    unoptimized: true,
    // Still required for `next/image` allowlist on external hosts.
    remotePatterns: [
      { protocol: "https", hostname: "i.ebayimg.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.vinted.net" },
      { protocol: "https", hostname: "**.depop.com" },
      { protocol: "https", hostname: "media-assets.grailed.com" },
      { protocol: "https", hostname: "**.grailed.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
