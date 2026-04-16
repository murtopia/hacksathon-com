"use client";

import { useState, useEffect, useRef } from "react";
import { PlanningFlow } from "@/components/planning/planning-flow";
import { rowToSession } from "@/lib/planning/context";
import type { PlanningSession } from "@/lib/planning/types";

interface PlanningFlowWrapperProps {
  existingSession?: Record<string, unknown>;
  userId?: string;
  profileName?: string | null;
  eventId?: string;
  eventName?: string;
  ideaId?: string;
  ideaName?: string;
  ideaPitch?: string;
  buildTool?: string;
  reviseMode?: boolean;
  existingBriefId?: string;
}

export function PlanningFlowWrapper({
  existingSession,
  userId,
  eventId,
  ideaId,
  buildTool,
  reviseMode,
  existingBriefId,
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
            mode: reviseMode ? "revise" : "create",
            existingBriefId: existingBriefId ?? null,
          }),
        });

        if (!res.ok) {
          setError("Failed to start planning session.");
          return;
        }

        const data = await res.json();
        setSession(data.session);

        // Update the URL with the session ID for reload support
        const url = new URL(window.location.href);
        url.searchParams.set("session", data.session.id);
        window.history.replaceState({}, "", url.toString());
      } catch {
        setError("Failed to start planning session.");
      }
    }

    createSession();
  }, [session, userId, eventId, ideaId, buildTool, reviseMode, existingBriefId]);

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
        <p className="mt-4 mono-label">Starting your planning session...</p>
      </div>
    );
  }

  return <PlanningFlow session={session} />;
}
