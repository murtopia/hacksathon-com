/**
 * Minimal RFC 5545 iCalendar builder for the admin "Add to calendar"
 * export. Scope is deliberately small: timed VEVENTs with a UTC start /
 * end, a summary, and an optional description. No RRULE, no VALARM, no
 * attendees - admins just want the block(s) on their calendar.
 */

export interface IcsEvent {
  /** Stable unique id (we use `${eventId}-${blockId}@hacksathon.com`). */
  uid: string;
  /** Event start. */
  start: Date;
  /** Event end. Defaults to start + 30m at the call site when unknown. */
  end: Date;
  summary: string;
  description?: string | null;
}

/** Escape TEXT values per RFC 5545 (backslash, comma, semicolon, newline). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Format a Date as a UTC timestamp: YYYYMMDDTHHMMSSZ. */
function formatUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * Fold lines longer than 75 octets per RFC 5545 (continuation lines
 * start with a single space). Keeps strict parsers (Outlook) happy.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 74) {
    chunks.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }
  if (remaining.length > 0) chunks.push(` ${remaining}`);
  return chunks.join("\r\n");
}

/**
 * Build a complete VCALENDAR document from one or more events. The
 * returned string uses CRLF line endings as required by the spec.
 */
export function buildIcsCalendar(events: IcsEvent[]): string {
  const stamp = formatUtc(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hacks-a-Thon//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${formatUtc(event.start)}`);
    lines.push(`DTEND:${formatUtc(event.end)}`);
    lines.push(`SUMMARY:${escapeText(event.summary)}`);
    if (event.description && event.description.trim().length > 0) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}

/** Filename-safe slug for the Content-Disposition header. */
export function icsFilename(base: string): string {
  const safe = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${safe || "schedule"}.ics`;
}
