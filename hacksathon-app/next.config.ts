import type { NextConfig } from "next";

// PostHog reverse proxy. Routing browser analytics through our own origin
// (`/ingest/*`) keeps ad-blockers from dropping events. Destinations are
// derived from the configured ingestion host so switching US <-> EU only
// requires changing NEXT_PUBLIC_POSTHOG_HOST.
const POSTHOG_HOST = (
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"
).replace(/\/$/, "");
// us.i.posthog.com -> us-assets.i.posthog.com (static asset / array bundle host).
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace(
  ".i.posthog.com",
  "-assets.i.posthog.com",
);

const nextConfig: NextConfig = {
  // PostHog uses trailing-slash-sensitive paths; don't let Next redirect them.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ];
  },
};

export default nextConfig;
