/**
 * Helpers for working with `<input type="datetime-local">`.
 *
 * The input wants `YYYY-MM-DDTHH:mm` in the browser's local time;
 * the DB stores ISO timestamps (with timezone). Conversion is lossy
 * by one minute (seconds dropped) - fine because all the admin
 * surfaces snap to 15-minute increments anyway.
 */

export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function localInputToIso(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Format a moment in time relative to now: "in 2 days at 9:00 AM",
 * "in 3 hours", "30 minutes ago". Used for live-status copy on the
 * voting + reflection window sections.
 */
export function relativeAt(target: Date, now: Date = new Date()): string {
  const diffMs = target.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(absMs / 3_600_000);
  const days = Math.round(absMs / 86_400_000);

  const time = target.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const dayLabel = target.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const future = diffMs > 0;

  if (minutes < 1) return future ? "in a moment" : "just now";
  if (minutes < 60) {
    return future
      ? `in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`
      : `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (hours < 24) {
    return future
      ? `in ${hours} ${hours === 1 ? "hour" : "hours"} at ${time}`
      : `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  return future
    ? `in ${days} ${days === 1 ? "day" : "days"} (${dayLabel} at ${time})`
    : `${days} ${days === 1 ? "day" : "days"} ago`;
}
