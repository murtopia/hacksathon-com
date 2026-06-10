import { anthropic } from "@ai-sdk/anthropic";

/**
 * Single source of truth for the AI model used across the planning engine.
 *
 * Centralized here so that future model swaps (e.g. when Claude 4.7 ships
 * or 4.6 is deprecated) are a one-line change - or a Vercel env override
 * with no deploy needed.
 *
 * Anthropic switched to a dateless model ID format starting with the
 * Claude 4.6 generation. Pinned-snapshot semantics live in the ID itself.
 *
 * To override at runtime (e.g. for a regression preview deploy that
 * verifies our error UI), set ANTHROPIC_PLANNING_MODEL on Vercel.
 */
export const PLANNING_MODEL_ID =
  process.env.ANTHROPIC_PLANNING_MODEL ?? "claude-sonnet-4-6";

export const planningModel = anthropic(PLANNING_MODEL_ID);
