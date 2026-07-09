/**
 * Content source for The Resource Library (/resources).
 *
 * Add new articles and field notes here; the page renders both lists
 * newest-first by `date`. No categories at launch (per the locked site
 * copy); a categorized restructure comes later when the library grows.
 */

export interface ResourceArticle {
  /** URL or path the title links to. */
  href: string;
  title: string;
  /** One-line description shown under the title. */
  description: string;
  /** ISO date (YYYY-MM-DD), used for newest-first ordering. */
  date: string;
}

export interface FieldNote {
  /** Short, dated, shareable note. Written to syndicate to X/LinkedIn. */
  body: string;
  /** ISO date (YYYY-MM-DD), displayed and used for ordering. */
  date: string;
}

export const articles: ResourceArticle[] = [];

export const fieldNotes: FieldNote[] = [];

export function newestFirst<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}
