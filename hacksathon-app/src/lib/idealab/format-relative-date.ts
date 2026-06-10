/**
 * Small dependency-free relative time formatter for "last updated"
 * timestamps on idea cards (mirrors the IdeaLab original copy).
 *
 * Examples:
 *   formatRelativeUpdatedAt(now)            -> "just now"
 *   formatRelativeUpdatedAt(5 min ago)      -> "5m ago"
 *   formatRelativeUpdatedAt(3 hours ago)    -> "3 hours ago"
 *   formatRelativeUpdatedAt(yesterday)      -> "yesterday"
 *   formatRelativeUpdatedAt(3 days ago)     -> "3 days ago"
 *   formatRelativeUpdatedAt(2 weeks ago)    -> "2 weeks ago"
 *   formatRelativeUpdatedAt(3 months ago)   -> "3 months ago"
 *   formatRelativeUpdatedAt(1 year ago)     -> "1 year ago"
 */
export function formatRelativeUpdatedAt(
  input: string | Date | null | undefined,
  now: Date = new Date(),
): string {
  if (!input) return "-";
  const then = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(then.getTime())) return "-";

  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) return "just now";

  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "just now";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ${hr === 1 ? "hour" : "hours"} ago`;

  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;

  const week = Math.floor(day / 7);
  if (week < 5) return `${week} ${week === 1 ? "week" : "weeks"} ago`;

  const month = Math.floor(day / 30);
  if (month < 12) return `${month} ${month === 1 ? "month" : "months"} ago`;

  const year = Math.floor(day / 365);
  return `${year} ${year === 1 ? "year" : "years"} ago`;
}
