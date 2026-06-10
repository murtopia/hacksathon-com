import posthog from "posthog-js";

/**
 * Client-side PostHog bootstrap.
 *
 * Next.js runs `instrumentation-client` before the app hydrates, so this is
 * the earliest place to init the browser SDK. We point ingestion at the
 * `/ingest` reverse proxy (see `next.config.ts` rewrites) to dodge
 * ad-blockers, while `ui_host` keeps "open in PostHog" links pointed at the
 * real app.
 *
 * Guarded on the public key so builds/previews without it configured don't
 * throw - PostHog simply stays dormant.
 */
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (posthogKey) {
  const ingestionHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  // us.i.posthog.com -> us.posthog.com (the dashboard / UI host).
  const uiHost = ingestionHost.replace(".i.posthog.com", ".posthog.com");

  posthog.init(posthogKey, {
    api_host: "/ingest",
    ui_host: uiHost,
    // Modern PostHog defaults: SPA pageviews via History API + pageleave,
    // sensible autocapture, etc. App Router route changes are captured
    // automatically through `history_change`.
    defaults: "2025-05-24",
    // Don't create person profiles for anonymous web visitors - only once
    // we explicitly identify a logged-in user. Cleaner web analytics, fewer
    // billable profiles.
    person_profiles: "identified_only",
  });
}
