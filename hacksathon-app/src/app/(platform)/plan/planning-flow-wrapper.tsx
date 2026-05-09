"use client";

import { useState, useEffect, useRef } from "react";
import { PlanningFlow } from "@/components/planning/planning-flow";
import { rowToSession } from "@/lib/planning/context";
import type { PlanningSession, ProjectBrief } from "@/lib/planning/types";

interface PlanningFlowWrapperProps {
  existingSession?: Record<string, unknown>;
  existingBrief?: Record<string, unknown> | null;
  userId?: string;
  profileName?: string | null;
  eventId?: string;
  eventName?: string;
  ideaId?: string;
  ideaName?: string;
  ideaPitch?: string;
  buildTool?: string;
}

export function PlanningFlowWrapper({
  existingSession,
  existingBrief,
  userId,
  eventId,
  ideaId,
  buildTool,
}: PlanningFlowWrapperProps) {
  const [session, setSession] = useState<PlanningSession | null>(
    existingSession ? rowToSession(existingSession) : null
  );
  const [error, setError] = useState<string | null>(null);
  const creating = useRef(false);

  useEffect(() => {
    if (session || creating.current) return;
    if (!userId) return;

    creating.current = true;

    async function createSession() {
      try {
        const res = await fetch("/api/planning/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: eventId ?? null,
            ideaId: ideaId ?? null,
            buildTool: buildTool ?? "lovable",
          }),
        });

        if (!res.ok) {
          setError("Failed to start planning session.");
          return;
        }

        const data = await res.json();
        setSession(data.session);

        // Persist session ID in the URL for reload support
        const url = new URL(window.location.href);
        url.searchParams.set("session", data.session.id);
        window.history.replaceState({}, "", url.toString());
      } catch {
        setError("Failed to start planning session.");
      }
    }

    createSession();
  }, [session, userId, eventId, ideaId, buildTool]);

  if (error) {
    return (
      <div className="max-w-[var(--container-narrow)] mx-auto text-center py-16">
        <p
          className="font-serif text-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          {error}
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-[var(--container-narrow)] mx-auto text-center py-16">
        <div
          className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border-default)",
            borderTopColor: "var(--text-primary)",
          }}
        />
        <p className="mt-4 mono-label">Starting your planning session…</p>
      </div>
    );
  }

  const initialBrief = existingBrief ? normalizeBrief(existingBrief) : null;

  return <PlanningFlow session={session} initialBrief={initialBrief} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBrief(raw: any): ProjectBrief {
  return {
    id: raw.id,
    eventId: raw.event_id ?? null,
    userId: raw.user_id,
    ideaId: raw.idea_id ?? null,
    planningSessionId: raw.planning_session_id,
    projectName: raw.project_name,
    oneSentenceScope: raw.one_sentence_scope,
    targetUser: raw.target_user,
    coreFeature: raw.core_feature,
    designVibe: raw.design_vibe ?? null,
    referenceUrl: raw.reference_url ?? null,
    colorToneNotes: raw.color_tone_notes ?? null,
    outOfScope: raw.out_of_scope,
    doneLooksLike: raw.done_looks_like,
    prdMarkdown: raw.prd_markdown ?? null,
    version: raw.version ?? 1,
    isCurrent: raw.is_current ?? true,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
