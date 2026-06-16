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
  "replit",
  "google-ai-studio",
  "cursor",
  "windsurf",
  "base44",
  "emergent",
  "claude-code",
  "chatgpt",
] as const;

export type RecognizedBuildTool = (typeof RECOGNIZED_BUILD_TOOLS)[number];

/**
 * How a recognized tool is grouped in the admin picker:
 *   - `recommended` - the first-class default (Lovable), shown as the hero card.
 *   - `builder`     - prompt-to-app builders for non-coders.
 *   - `owned`       - tools companies likely already pay for / get for free.
 *   - `dev`         - developer-oriented IDEs/agents.
 */
export type BuildToolCategory = "recommended" | "builder" | "owned" | "dev";

interface RecognizedToolMeta {
  label: string;
  /** Public homepage, or a learn-more page. */
  url: string;
  /**
   * Outbound link surfaced on the picker's "Learn more" / explore actions.
   * Today this equals the homepage for every tool. When a real affiliate or
   * referral link exists, swap it in here AND flip `affiliate` to true so the
   * outbound anchor gets `rel="sponsored"`. This file is the single source of
   * truth - do not duplicate the registry elsewhere.
   */
  affiliateUrl: string;
  /**
   * True only when `affiliateUrl` is a real, enrolled affiliate/referral link
   * (so outbound anchors render `rel="sponsored"`). No tool qualifies yet;
   * Lovable flips to true once the affiliate application is approved.
   */
  affiliate: boolean;
  category: BuildToolCategory;
  /** Short, one-line description shown in the picker and explore list. */
  blurb: string;
  /**
   * True = appears in the picker as a choosable event build tool (and renders
   * the showcase "Built with X" chip). False = explore-only: surfaced as an
   * outbound link for discovery, never stored as the event's build tool.
   */
  selectable: boolean;
  /** Path under /public to a full-color logo. */
  logo: string;
}

const RECOGNIZED_TOOL_META: Record<RecognizedBuildTool, RecognizedToolMeta> = {
  lovable: {
    label: "Lovable",
    url: "https://lovable.dev",
    // Live impact.com affiliate link (approved 2026-06-16). `url` stays the
    // plain homepage for the informational "pointed at lovable.dev" note;
    // this is the outbound link we get credit for.
    affiliateUrl: "https://lovablelabs.pxf.io/c/7413626/3802905/49205",
    affiliate: true,
    category: "recommended",
    blurb: "Best for non-technical teams. Fastest path from idea to a live app.",
    selectable: true,
    logo: "/build-tools/lovable.png",
  },
  bolt: {
    label: "Bolt",
    url: "https://bolt.new",
    affiliateUrl: "https://bolt.new",
    affiliate: false,
    category: "builder",
    blurb: "Fast generation with code access.",
    selectable: true,
    logo: "/build-tools/bolt.svg",
  },
  v0: {
    label: "v0 by Vercel",
    url: "https://v0.dev",
    affiliateUrl: "https://v0.dev",
    affiliate: false,
    category: "builder",
    blurb: "Polished React and Next.js interfaces from prompts.",
    selectable: true,
    logo: "/build-tools/v0.svg",
  },
  replit: {
    label: "Replit",
    url: "https://replit.com",
    affiliateUrl: "https://replit.com",
    affiliate: false,
    category: "builder",
    blurb: "All-in-one browser IDE with event credits.",
    selectable: true,
    logo: "/build-tools/replit.svg",
  },
  "google-ai-studio": {
    label: "Google AI Studio",
    url: "https://aistudio.google.com",
    affiliateUrl: "https://aistudio.google.com",
    affiliate: false,
    category: "owned",
    blurb: "Free Gemini playground for quick prototypes.",
    selectable: true,
    logo: "/build-tools/google-ai-studio.svg",
  },
  cursor: {
    label: "Cursor",
    url: "https://cursor.com",
    affiliateUrl: "https://cursor.com",
    affiliate: false,
    category: "dev",
    blurb: "Developer-focused AI code editor.",
    selectable: false,
    logo: "/build-tools/cursor.svg",
  },
  windsurf: {
    label: "Windsurf",
    url: "https://windsurf.com",
    affiliateUrl: "https://windsurf.com",
    affiliate: false,
    category: "dev",
    blurb: "Agent-first developer tool.",
    selectable: false,
    logo: "/build-tools/windsurf.svg",
  },
  base44: {
    label: "Base44",
    url: "https://base44.com",
    affiliateUrl: "https://base44.com",
    affiliate: false,
    category: "builder",
    blurb: "Easiest for non-coders.",
    selectable: false,
    logo: "/build-tools/base44.svg",
  },
  emergent: {
    label: "Emergent",
    url: "https://emergent.sh",
    affiliateUrl: "https://emergent.sh",
    affiliate: false,
    category: "builder",
    blurb: "Full-stack builder.",
    selectable: false,
    logo: "/build-tools/emergent.svg",
  },
  "claude-code": {
    label: "Claude Code",
    url: "https://claude.com/product/claude-code",
    affiliateUrl: "https://claude.com/product/claude-code",
    affiliate: false,
    category: "owned",
    blurb: "Included with Claude plans.",
    selectable: false,
    logo: "/build-tools/claude-code.svg",
  },
  chatgpt: {
    label: "ChatGPT / Codex",
    url: "https://openai.com/codex",
    affiliateUrl: "https://openai.com/codex",
    affiliate: false,
    category: "owned",
    blurb: "Included with ChatGPT plans.",
    selectable: false,
    logo: "/build-tools/chatgpt.svg",
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
  /** True when `affiliateUrl` is a real affiliate link (=> rel="sponsored"). */
  affiliate: boolean;
  /** Grouping category, or null for BYO/custom values. */
  category: BuildToolCategory | null;
  /** One-line description, or null for BYO/custom values. */
  blurb: string | null;
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
      affiliate: meta.affiliate,
      category: meta.category,
      blurb: meta.blurb,
      logo: meta.logo,
    };
  }
  return {
    value: norm,
    label: norm === BYO_BUILD_TOOL ? BYO_BUILD_TOOL_LABEL : GENERIC_BUILD_TOOL_LABEL,
    homepageUrl: null,
    affiliateUrl: null,
    affiliate: false,
    category: null,
    blurb: null,
    logo: null,
  };
}

/**
 * The recommended first-class default surfaced as the picker's hero card.
 */
export const RECOMMENDED_BUILD_TOOL: RecognizedBuildTool = "lovable";

/**
 * Recognized tools an organizer can actually pick as the event build tool
 * (everything with `selectable: true`). Drives the picker dropdown and the
 * showcase "Built with X" chip. The recommended default is included here too.
 */
export const SELECTABLE_BUILD_TOOLS: RecognizedBuildTool[] =
  RECOGNIZED_BUILD_TOOLS.filter(
    (value) => RECOGNIZED_TOOL_META[value].selectable,
  );

/**
 * Explore-only tools (never stored as the event build tool) surfaced as
 * outbound links for discovery, grouped for the "explore other tools"
 * section: prompt-to-app `builders` for non-coders, and `owned`/`dev` tools
 * companies likely already have.
 */
export function getExploreBuildTools(): {
  builders: BuildToolMeta[];
  owned: BuildToolMeta[];
} {
  const exploreOnly = RECOGNIZED_BUILD_TOOLS.filter(
    (value) => !RECOGNIZED_TOOL_META[value].selectable,
  ).map((value) => buildToolMeta(value));
  return {
    builders: exploreOnly.filter((meta) => meta.category === "builder"),
    owned: exploreOnly.filter(
      (meta) => meta.category === "owned" || meta.category === "dev",
    ),
  };
}
