import "server-only";
import { PostHog } from "posthog-node";
import type { AnalyticsEventName } from "@/lib/analytics/events";

/**
 * Server-side PostHog capture.
 *
 * Used for events we only trust the server for - purchases (fired from the
 * Stripe webhook), participant joins, idea submissions, and votes. The
 * browser SDK handles pageviews + identity; this handles authoritative
 * business events keyed by the Supabase user id (`distinctId`) so they
 * stitch onto the same person as the client-side `$pageview`s.
 *
 * No-ops when `NEXT_PUBLIC_POSTHOG_KEY` is absent, so local/dev without a
 * key configured stays silent rather than throwing.
 *
 * Note: server-side capture talks directly to the PostHog ingestion host
 * (NEXT_PUBLIC_POSTHOG_HOST), not the browser `/ingest` reverse proxy.
 */
let client: PostHog | null = null;

function getServerPostHog(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // Serverless: send immediately rather than buffering across an
      // instance we may not revisit before it's frozen.
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export async function captureServer(input: {
  distinctId: string;
  event: AnalyticsEventName;
  properties?: Record<string, unknown>;
}): Promise<void> {
  const posthog = getServerPostHog();
  if (!posthog || !input.distinctId) return;

  posthog.capture({
    distinctId: input.distinctId,
    event: input.event,
    properties: input.properties,
  });

  // Best-effort flush; never let analytics delivery surface as an error in
  // the request path.
  try {
    await posthog.flush();
  } catch {
    // Swallow - analytics is non-critical.
  }
}
