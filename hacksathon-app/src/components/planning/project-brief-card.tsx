"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ProjectBrief } from "@/lib/planning/types";

interface ProjectBriefCardProps {
  brief: ProjectBrief;
  onCopyStarterPrompt: () => void;
  onDownloadPrd: () => void;
  starterPromptLoading?: boolean;
  updating?: boolean;
}

export function ProjectBriefCard({
  brief,
  onCopyStarterPrompt,
  onDownloadPrd,
  starterPromptLoading,
  updating,
}: ProjectBriefCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    onCopyStarterPrompt();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-sm p-[var(--space-6)] relative"
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <span className="mono-label">Your PRD</span>
        <button
          type="button"
          onClick={onDownloadPrd}
          disabled={updating || !brief.prdMarkdown}
          className="font-sans text-xs transition-colors disabled:opacity-50"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            if (!updating)
              e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-tertiary)")
          }
        >
          ↓ Download PRD
        </button>
      </div>

      {/* The PRD itself — rendered from prdMarkdown */}
      <div className="prd-markdown">
        {brief.prdMarkdown ? (
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1
                  className="font-serif text-[36px] leading-tight mb-6"
                  style={{ color: "var(--text-primary)" }}
                >
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2
                  className="font-serif text-[24px] leading-tight mt-8 mb-3 pb-2"
                  style={{
                    color: "var(--text-primary)",
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mono-label mt-5 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p
                  className="font-serif text-[16px] leading-relaxed mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="space-y-1.5 mb-4 ml-5 list-decimal">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li
                  className="font-serif text-[16px] leading-relaxed pl-4 relative"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span
                    className="absolute left-0 top-[0.4em]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    ·
                  </span>
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong
                  className="font-sans font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em
                  className="font-serif italic"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {children}
                </em>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {children}
                </a>
              ),
              hr: () => (
                <hr
                  className="my-6"
                  style={{ borderColor: "var(--border-default)" }}
                />
              ),
            }}
          >
            {brief.prdMarkdown}
          </ReactMarkdown>
        ) : (
          <p
            className="font-serif italic"
            style={{ color: "var(--text-tertiary)" }}
          >
            PRD is being prepared…
          </p>
        )}
      </div>

      {/* Updating overlay — light scrim while regenerating */}
      {updating && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-sm"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
          }}
        >
          <div className="text-center">
            <div
              className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--border-default)",
                borderTopColor: "var(--text-primary)",
              }}
            />
            <p className="mt-3 mono-label">Updating your PRD…</p>
          </div>
        </div>
      )}

      <div
        className="mt-8 pt-6"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <button
          type="button"
          onClick={handleCopy}
          disabled={starterPromptLoading || updating}
          className="gradient-border w-full py-3 px-4 rounded-sm font-mono text-xs font-semibold uppercase tracking-widest transition-colors disabled:opacity-50"
          style={{ color: "var(--text-primary)" }}
        >
          {starterPromptLoading
            ? "Generating…"
            : copied
              ? "Copied!"
              : "◆ Copy Starter Prompt →"}
        </button>
      </div>
    </div>
  );
}
