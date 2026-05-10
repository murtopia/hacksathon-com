"use client";

import { useState } from "react";
import { Check, Copy as CopyIcon } from "lucide-react";

interface StarterPromptProps {
  prompt: string | null;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * The Next Steps panel — the single most important UX moment for a
 * non-technical participant. Above the prompt itself we show the
 * verbatim five-step kickoff instructions from the planning doc, so
 * pasting into Lovable (or another tool) is completely explicit. The
 * prominent "Copy Starter Prompt" CTA lives here (not on the Blueprint
 * card above) so the call-to-action sits right next to the prompt it
 * copies.
 */
export function StarterPrompt({ prompt, error, onRetry }: StarterPromptProps) {
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedCta, setCopiedCta] = useState(false);

  async function handleCopy(
    setCopied: (v: boolean) => void
  ) {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const ctaLabel = !prompt
    ? error
      ? "Starter Prompt unavailable"
      : "Preparing Starter Prompt…"
    : copiedCta
      ? "Copied!"
      : "Copy Starter Prompt";

  return (
    <div
      className="rounded-sm p-[var(--space-6)]"
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="mb-5">
        <span className="mono-label">Next Steps — Build It</span>
        <p
          className="font-serif text-[16px] leading-relaxed mt-3"
          style={{ color: "var(--text-secondary)" }}
        >
          This is how you kick off your build in Lovable (or Cursor or Bolt).
        </p>
      </div>

      <ol className="space-y-3 mb-6">
        <InstructionStep
          number={1}
          text="Download your Blueprint from the card above — Download .md or Save as PDF, your choice."
        />
        <InstructionStep
          number={2}
          text="Open your build tool and start a new project."
        />
        <InstructionStep
          number={3}
          text="Paste the Starter Prompt below as your very first message."
        />
        <InstructionStep
          number={4}
          text="Attach your Blueprint file. In Lovable, click the paperclip icon and upload it. This gives the AI everything it needs to build the right thing from the start."
        />
        <InstructionStep number={5} text="Hit send. You're building." />
      </ol>

      {/* Primary CTA — sits directly above the prompt it copies. */}
      {error && onRetry ? (
        <div
          className="py-4 px-4 mb-3 rounded-sm"
          style={{
            backgroundColor: "var(--surface-muted, #fafafa)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p
            className="font-serif text-[14px] leading-relaxed mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mono-label transition-colors hover:text-[var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            ↻ Retry
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => handleCopy(setCopiedCta)}
        disabled={!prompt}
        className="gradient-border w-full py-3 px-4 mb-4 rounded-sm font-mono text-xs font-semibold uppercase tracking-widest transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 print:hidden"
        style={{ color: "var(--text-primary)" }}
      >
        {prompt &&
          (copiedCta ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <CopyIcon size={14} aria-hidden="true" />
          ))}
        <span>{ctaLabel}</span>
        {prompt && !copiedCta && <span aria-hidden="true">→</span>}
      </button>

      <div
        className="rounded-sm p-4 relative"
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--text-tertiary)" }}
          >
            The Prompt
          </span>
          <button
            type="button"
            onClick={() => handleCopy(setCopiedHeader)}
            disabled={!prompt}
            className="font-sans text-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{
              color: copiedHeader
                ? "var(--text-primary)"
                : "var(--text-tertiary)",
            }}
          >
            {copiedHeader ? (
              <Check size={12} aria-hidden="true" />
            ) : (
              <CopyIcon size={12} aria-hidden="true" />
            )}
            {copiedHeader ? "Copied!" : "Copy"}
          </button>
        </div>

        {prompt ? (
          <pre
            className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-secondary)" }}
          >
            {prompt}
          </pre>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 border-2 rounded-full animate-spin shrink-0"
              style={{
                borderColor: "var(--border-default)",
                borderTopColor: "var(--text-primary)",
              }}
              aria-hidden="true"
            />
            <p
              className="font-serif italic text-[14px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {error
                ? "Starter Prompt unavailable."
                : "Preparing your Starter Prompt…"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InstructionStep({ number, text }: { number: number; text: string }) {
  return (
    <li className="flex gap-3">
      <span
        className="font-mono text-[12px] uppercase tracking-widest pt-1 shrink-0"
        style={{ color: "var(--text-tertiary)", minWidth: "3.5em" }}
      >
        Step {number}
      </span>
      <span
        className="font-serif text-[16px] leading-relaxed"
        style={{ color: "var(--text-primary)" }}
      >
        {text}
      </span>
    </li>
  );
}
