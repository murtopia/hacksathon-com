"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy as CopyIcon } from "lucide-react";
import type { ProjectBrief } from "@/lib/planning/types";

interface ProjectBriefCardProps {
  brief: ProjectBrief;
  onCopyBlueprint: () => void;
  onDownloadPrd: () => void;
  onSaveAsPdf: () => void;
  updating?: boolean;
}

/**
 * The rendered Blueprint card — header AND footer expose the same
 * Copy / Download / Save as PDF actions because the Blueprint can run
 * 1.5–2 pages and scrolling back to the top to take action is friction.
 * The Starter Prompt CTA lives in the StarterPrompt panel below this
 * card so the call-to-action sits right next to the prompt it copies.
 */
export function ProjectBriefCard({
  brief,
  onCopyBlueprint,
  onDownloadPrd,
  onSaveAsPdf,
  updating,
}: ProjectBriefCardProps) {
  const [copiedBlueprint, setCopiedBlueprint] = useState(false);

  function handleCopyBlueprint() {
    onCopyBlueprint();
    setCopiedBlueprint(true);
    setTimeout(() => setCopiedBlueprint(false), 2000);
  }

  const actionRow = (
    <div className="flex items-center gap-1 print:hidden">
      <CardAction
        onClick={handleCopyBlueprint}
        disabled={updating || !brief.prdMarkdown}
        label={copiedBlueprint ? "Copied!" : "Copy"}
        ariaLabel="Copy Blueprint markdown to clipboard"
        icon={copiedBlueprint ? "check" : "copy"}
      />
      <ActionDivider />
      <CardAction
        onClick={onDownloadPrd}
        disabled={updating || !brief.prdMarkdown}
        label="Download .md"
        ariaLabel="Download Blueprint as Markdown file"
      />
      <ActionDivider />
      <CardAction
        onClick={onSaveAsPdf}
        disabled={updating || !brief.prdMarkdown}
        label="Save as PDF"
        ariaLabel="Save Blueprint as PDF"
      />
    </div>
  );

  return (
    <div
      className="rounded-sm p-[var(--space-6)] relative"
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <span className="mono-label">Your Blueprint</span>
        {actionRow}
      </div>

      {/* The Blueprint itself — rendered from prdMarkdown */}
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
            Blueprint is being prepared…
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
            <p className="mt-3 mono-label">Updating your Blueprint…</p>
          </div>
        </div>
      )}

      {/* Repeat the Blueprint actions at the bottom — the document can
          run 1.5–2 pages and scrolling back up to act is friction. */}
      <div
        className="mt-8 pt-6 flex items-center justify-end gap-4 flex-wrap print:hidden"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        {actionRow}
      </div>
    </div>
  );
}

function CardAction({
  onClick,
  disabled,
  label,
  ariaLabel,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  ariaLabel: string;
  icon?: "copy" | "check";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="font-sans text-xs px-2 py-1 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
      style={{ color: "var(--text-tertiary)" }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = "var(--text-tertiary)")
      }
    >
      {icon === "copy" && <CopyIcon size={12} aria-hidden="true" />}
      {icon === "check" && <Check size={12} aria-hidden="true" />}
      {label}
    </button>
  );
}

function ActionDivider() {
  return (
    <span
      aria-hidden="true"
      className="font-sans text-xs"
      style={{ color: "var(--text-tertiary)", opacity: 0.4 }}
    >
      ·
    </span>
  );
}
