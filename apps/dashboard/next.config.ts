import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@gnana/client", "@gnana/db"],
  typescript: {
    // Type checking is handled by `pnpm typecheck` in CI.
    // next build's tsc pass hits phantom-type mismatches from pnpm's
    // virtual store (drizzle-orm resolved at two different paths).
    ignoreBuildErrors: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: "gnanalytica-7j",
  project: "gnana-dashboard",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
});
