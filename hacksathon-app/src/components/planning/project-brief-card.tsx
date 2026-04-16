"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProjectBrief } from "@/lib/planning/types";

interface ProjectBriefCardProps {
  brief: ProjectBrief;
  onCopyStarterPrompt: () => void;
  starterPromptLoading?: boolean;
}

export function ProjectBriefCard({
  brief,
  onCopyStarterPrompt,
  starterPromptLoading,
}: ProjectBriefCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    onCopyStarterPrompt();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sections = [
    { label: "One-Sentence Scope", value: brief.oneSentenceScope },
    { label: "Target User", value: brief.targetUser },
    { label: "Core Feature", value: brief.coreFeature },
    { label: "Design Direction", value: brief.designVibe },
    { label: "Reference", value: brief.referenceUrl },
    { label: "Color & Tone", value: brief.colorToneNotes },
    { label: "Out of Scope", value: brief.outOfScope },
    { label: "Done Looks Like", value: brief.doneLooksLike },
  ].filter((s) => s.value);

  return (
    <div
      className="rounded-sm p-[var(--space-6)]"
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="mono-label">Project Brief</span>
      </div>

      <div
        className="mb-6 pb-4"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <h3>{brief.projectName}</h3>
      </div>

      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="mono-label mb-2">{section.label}</div>
            <p
              className="font-sans text-[15px] leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {section.value}
            </p>
          </div>
        ))}
      </div>

      <div
        className="mt-6 pt-6"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <button
          type="button"
          onClick={handleCopy}
          disabled={starterPromptLoading}
          className="gradient-border w-full py-3 px-4 rounded-sm font-mono text-xs font-semibold uppercase tracking-widest transition-colors disabled:opacity-50"
          style={{ color: "var(--text-primary)" }}
        >
          {starterPromptLoading
            ? "Generating..."
            : copied
              ? "Copied!"
              : "◆ Copy your first prompt →"}
        </button>
      </div>
    </div>
  );
}
