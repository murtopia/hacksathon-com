/**
 * Shared URL validation for IdeaLab live links.
 *
 * Used client-side in the demo-assets section of idea-detail.tsx to
 * surface an inline error before we hit the network, and server-side
 * in `PATCH /api/ideas/[id]` to ensure a malformed value can't slip in
 * through a hand-rolled request.
 *
 * Rules:
 *   - Must parse as a URL.
 *   - Protocol must be http or https. We deliberately reject mailto:,
 *     ftp:, javascript:, etc., because we render the value as a link.
 *   - Callers handle the "empty string = clear the field" case before
 *     this helper.
 */
export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
