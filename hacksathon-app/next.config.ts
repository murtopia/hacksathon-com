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
  // Branded campaign short links: friendly /go/* paths that forward to the
  // real destination with full UTM parameters, so posts and printed
  // materials never show a raw tracking URL. Non-permanent (307) so a
  // campaign can be re-pointed later without browsers caching the old
  // destination. The "go" slug is reserved in reserved-slugs.ts.
  async redirects() {
    return [
      {
        source: "/go/agency-launch",
        destination:
          "/seven2?utm_source=linkedin&utm_medium=organic&utm_campaign=agency-launch-q3&utm_content=founder-quote-v1",
        permanent: false,
      },
    ];
  },
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
