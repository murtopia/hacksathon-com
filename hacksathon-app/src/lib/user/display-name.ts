/**
 * Pick the friendliest short display name we can render for a signed-in
 * user - first token of their full name when present, otherwise the
 * email's local part. Used in surfaces like the platform header where a
 * single given name reads more warmly than a full email.
 *
 * Returns `null` only when both inputs are empty.
 */
export function pickFirstName(
  fullName: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const trimmed = fullName?.trim();
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0];
    if (first) return first;
  }
  const localPart = email?.split("@")[0]?.trim();
  return localPart && localPart.length > 0 ? localPart : null;
}
