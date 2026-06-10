/**
 * Single source of truth for how an `events.build_tool` value is
 * rendered to participants.
 *
 * The DB column is free-form text (see migration
 * `00023_event_build_tool_freeform.sql`) - an organizer can pick a
 * recognized tool from the admin dropdown OR type a custom name via
 * the "Other" option. We don't render arbitrary user-typed strings
 * verbatim in copy because they may not fit the surrounding
 * sentences and instructions (e.g. "click the paperclip icon"
 * doesn't apply to every tool). Instead, copy uses
 * `buildToolLabel(buildTool)` which:
 *
 *   - returns the polished display label (e.g. "Lovable", "v0") if
 *     the value is one of the recognized tools, or
 *   - returns the generic fallback "your vibe coding app" otherwise.
 *
 * Tool-specific instruction copy should additionally branch on
 * `isRecognizedBuildTool(buildTool)` so unrecognized tools get a
 * generic step instead of a Lovable-specific one.
 */

export const RECOGNIZED_BUILD_TOOLS = [
  "lovable",
  "bolt",
  "v0",
  "cursor",
  "replit",
  "google-ai-studio",
] as const;

export type RecognizedBuildTool = (typeof RECOGNIZED_BUILD_TOOLS)[number];

interface RecognizedToolMeta {
  label: string;
  /** Public homepage. */
  url: string;
  /**
   * Outbound link surfaced on the admin picker's "Learn more" action.
   * Placeholder = the homepage today; swap in real affiliate/referral
   * URLs here when they exist (single source of truth).
   */
  affiliateUrl: string;
  /** Path under /public to a full-color logo. */
  logo: string;
}

const RECOGNIZED_TOOL_META: Record<RecognizedBuildTool, RecognizedToolMeta> = {
  lovable: {
    label: "Lovable",
    url: "https://lovable.dev",
    affiliateUrl: "https://lovable.dev",
    logo: "/build-tools/lovable.svg",
  },
  bolt: {
    label: "Bolt",
    url: "https://bolt.new",
    affiliateUrl: "https://bolt.new",
    logo: "/build-tools/bolt.svg",
  },
  v0: {
    label: "v0 by Vercel",
    url: "https://v0.dev",
    affiliateUrl: "https://v0.dev",
    logo: "/build-tools/v0.svg",
  },
  cursor: {
    label: "Cursor",
    url: "https://cursor.com",
    affiliateUrl: "https://cursor.com",
    logo: "/build-tools/cursor.svg",
  },
  replit: {
    label: "Replit",
    url: "https://replit.com",
    affiliateUrl: "https://replit.com",
    logo: "/build-tools/replit.svg",
  },
  "google-ai-studio": {
    label: "Google AI Studio",
    url: "https://aistudio.google.com",
    affiliateUrl: "https://aistudio.google.com",
    logo: "/build-tools/google-ai-studio.svg",
  },
};

/**
 * Sentinel `events.build_tool` value meaning "we're not standardizing on
 * one tool - participants use whatever they want (their own, or one
 * that's already part of the company's plan)." Not a recognized tool, so
 * participant tool-specific copy uses the generic path.
 */
export const BYO_BUILD_TOOL = "byo";

/**
 * The phrase we use when a build_tool value isn't in the recognized
 * set. Keep this short, lowercased, and natural enough to drop into
 * the middle of a sentence - e.g. "you'll hand to your vibe coding
 * app" or "kick off your build in your vibe coding app".
 */
export const GENERIC_BUILD_TOOL_LABEL = "your vibe coding app";

/** Mid-sentence phrase for the bring-your-own / free-choice option. */
export const BYO_BUILD_TOOL_LABEL = "your chosen build tool";

function normalize(buildTool: string | null | undefined): string {
  return (buildTool ?? "").trim().toLowerCase();
}

export function isRecognizedBuildTool(
  buildTool: string | null | undefined,
): buildTool is RecognizedBuildTool {
  const norm = normalize(buildTool);
  return (RECOGNIZED_BUILD_TOOLS as readonly string[]).includes(norm);
}

/** True when the value is the bring-your-own / free-choice sentinel. */
export function isByoBuildTool(buildTool: string | null | undefined): boolean {
  return normalize(buildTool) === BYO_BUILD_TOOL;
}

/**
 * Polished display label for a recognized tool, or the generic
 * fallback. Use this anywhere a tool name is dropped into rendered
 * copy.
 */
export function buildToolLabel(buildTool: string | null | undefined): string {
  const norm = normalize(buildTool);
  if (norm in RECOGNIZED_TOOL_META) {
    return RECOGNIZED_TOOL_META[norm as RecognizedBuildTool].label;
  }
  if (norm === BYO_BUILD_TOOL) {
    return BYO_BUILD_TOOL_LABEL;
  }
  return GENERIC_BUILD_TOOL_LABEL;
}

/**
 * Public homepage URL for a recognized tool, or `null` if the tool
 * isn't recognized. Surfaces beneath the admin picker and on the
 * "where will I paste this" hand-off, but only when we actually
 * have a URL to point at.
 */
export function buildToolUrl(buildTool: string | null | undefined): string | null {
  const norm = normalize(buildTool);
  if (norm in RECOGNIZED_TOOL_META) {
    return RECOGNIZED_TOOL_META[norm as RecognizedBuildTool].url;
  }
  return null;
}

export interface BuildToolMeta {
  /** Normalized stored value. */
  value: string;
  label: string;
  homepageUrl: string | null;
  /** Outbound "Learn more" link (affiliate placeholder = homepage today). */
  affiliateUrl: string | null;
  /** Full-color logo path under /public, or null for a lettermark fallback. */
  logo: string | null;
}

/**
 * Presentational metadata for the admin build-tool picker (logo + label
 * + outbound link). Recognized tools resolve to their brand assets; BYO
 * and custom "Other" values resolve to label-only entries with no logo.
 */
export function buildToolMeta(
  buildTool: string | null | undefined,
): BuildToolMeta {
  const norm = normalize(buildTool);
  if (norm in RECOGNIZED_TOOL_META) {
    const meta = RECOGNIZED_TOOL_META[norm as RecognizedBuildTool];
    return {
      value: norm,
      label: meta.label,
      homepageUrl: meta.url,
      affiliateUrl: meta.affiliateUrl,
      logo: meta.logo,
    };
  }
  return {
    value: norm,
    label: norm === BYO_BUILD_TOOL ? BYO_BUILD_TOOL_LABEL : GENERIC_BUILD_TOOL_LABEL,
    homepageUrl: null,
    affiliateUrl: null,
    logo: null,
  };
}
