"use client";

import { useState } from "react";

interface StarterPromptProps {
  prompt: string;
}

export function StarterPrompt({ prompt }: StarterPromptProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
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
      <div className="flex items-center justify-between mb-4">
        <span className="mono-label">Starter Prompt</span>
        <button
          type="button"
          onClick={handleCopy}
          className="font-sans text-xs transition-colors"
          style={{ color: copied ? "var(--text-primary)" : "var(--text-tertiary)" }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <pre
        className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap"
        style={{ color: "var(--text-secondary)" }}
      >
        {prompt}
      </pre>
    </div>
  );
}
