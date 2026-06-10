"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

/**
 * Supplies the PostHog client to the React tree so descendants can call
 * `usePostHog()` (identify on login, reset on logout, capture product
 * events). The instance itself is initialized in `instrumentation-client.ts`
 * before hydration; this only wires up context.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
