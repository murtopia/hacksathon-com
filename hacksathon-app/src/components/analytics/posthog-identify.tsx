"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

/**
 * Ties the current PostHog person to the signed-in Supabase user.
 *
 * Rendered from authenticated server layouts (which already resolve the
 * user), so identity is re-asserted on every authenticated navigation -
 * covering OAuth logins and returning sessions where the client-side
 * login handler never ran. Skips the call when the distinct id already
 * matches to avoid redundant `$identify` events.
 */
export function PostHogIdentify({
  userId,
  email,
}: {
  userId: string;
  email?: string | null;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog || !userId) return;
    if (posthog.get_distinct_id() === userId) return;
    posthog.identify(userId, email ? { email } : undefined);
  }, [posthog, userId, email]);

  return null;
}
