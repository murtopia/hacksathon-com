"use client";

import { useState } from "react";

interface StarterPromptProps {
  prompt: string | null;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * The Next Steps panel — the single most important UX moment for a
 * non-technical participant. Above the prompt itself we show the
 * verbatim five-step kickoff instructions from the planning doc, so
 * pasting into Lovable (or another tool) is completely explicit.
 */
export function StarterPrompt({ prompt, error, onRetry }: StarterPromptProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
            onClick={handleCopy}
            disabled={!prompt}
            className="font-sans text-xs transition-colors disabled:opacity-50"
            style={{
              color: copied ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {prompt ? (
          <pre
            className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-secondary)" }}
          >
            {prompt}
          </pre>
        ) : error ? (
          <div className="space-y-2">
            <p
              className="font-serif italic text-[14px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {error}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mono-label transition-colors hover:text-[var(--text-primary)]"
                style={{ color: "var(--text-secondary)" }}
              >
                ↻ Retry
              </button>
            )}
          </div>
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
              Preparing your Starter Prompt…
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
