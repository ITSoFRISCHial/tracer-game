import type { NextConfig } from "next";

/**
 * Dev Notes: Hosting
 *
 * The game is 100% client-side (no API routes, no server components that need
 * a runtime), so it is built as a static export into `out/` and served by
 * Cloudflare Workers static assets (see wrangler.jsonc and docs/DEPLOYMENT.md).
 * Do not add server-only features (route handlers, middleware, ISR) without
 * switching to an adapter such as vinext or OpenNext.
 */
const nextConfig: NextConfig = {
  output: "export",
  // Static export cannot use the image optimizer; the app does not use next/image anyway.
  images: { unoptimized: true },
};

export default nextConfig;
