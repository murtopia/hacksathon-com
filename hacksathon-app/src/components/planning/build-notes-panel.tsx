"use client";

import { useState } from "react";
import type { BuildNotes } from "@/lib/planning/types";

interface BuildNotesPanelProps {
  buildNotes: BuildNotes | null;
  loading?: boolean;
}

export function BuildNotesPanel({ buildNotes, loading }: BuildNotesPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div
        className="rounded-sm p-4"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <span className="mono-label">Build Notes</span>
        <div className="mt-3 space-y-2">
          <div
            className="h-3 rounded animate-pulse"
            style={{ backgroundColor: "var(--border-default)", width: "80%" }}
          />
          <div
            className="h-3 rounded animate-pulse"
            style={{ backgroundColor: "var(--border-default)", width: "60%" }}
          />
        </div>
      </div>
    );
  }

  if (!buildNotes) return null;

  const hasContent =
    buildNotes.tensions.length > 0 ||
    buildNotes.considerations.length > 0 ||
    buildNotes.assumptions.length > 0 ||
    buildNotes.v1ScopeSuggestion;

  if (!hasContent) return null;

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{ border: "1px solid var(--border-default)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-4 text-left transition-colors hover:bg-[var(--bg-secondary)]"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {expanded ? "▾" : "▸"}
        </span>
        <span className="mono-label">Build Notes</span>
      </button>

      {expanded && (
        <div className="p-5 space-y-5" style={{ backgroundColor: "var(--white)" }}>
          {buildNotes.tensions.length > 0 && (
            <NoteSection title="Tensions" items={buildNotes.tensions} />
          )}
          {buildNotes.considerations.length > 0 && (
            <NoteSection title="Considerations" items={buildNotes.considerations} />
          )}
          {buildNotes.assumptions.length > 0 && (
            <NoteSection title="Assumptions" items={buildNotes.assumptions} />
          )}
          {buildNotes.v1ScopeSuggestion && (
            <div>
              <div className="mono-label mb-2">V1 Scope Suggestion</div>
              <p
                className="font-serif text-[15px] leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {buildNotes.v1ScopeSuggestion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NoteSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mono-label mb-2">{title}</div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="font-serif text-[15px] leading-relaxed pl-4 relative"
            style={{ color: "var(--text-secondary)" }}
          >
            <span
              className="absolute left-0 top-[0.5em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              ·
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
