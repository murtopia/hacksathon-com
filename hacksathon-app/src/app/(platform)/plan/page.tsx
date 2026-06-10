import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanningFlowWrapper } from "./planning-flow-wrapper";

export const metadata: Metadata = {
  title: "Plan Your Build",
};

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{
    session?: string;
    event?: string;
    idea?: string;
    tool?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;

  // If a session ID is provided, load it (along with its brief if any)
  if (params.session) {
    const { data: sessionRow } = await supabase
      .from("planning_sessions")
      .select("*")
      .eq("id", params.session)
      .single();

    if (sessionRow && sessionRow.user_id === user.id) {
      let existingBrief = null;
      if (sessionRow.brief_id) {
        const { data: brief } = await supabase
          .from("project_briefs")
          .select("*")
          .eq("id", sessionRow.brief_id)
          .single();
        existingBrief = brief;
      }

      return (
        <div className="py-4">
          {!existingBrief && <PlanningIntro />}
          <PlanningFlowWrapper
            existingSession={sessionRow}
            existingBrief={existingBrief}
          />
        </div>
      );
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Idea context (Scenario A - pre-load project name + pitch)
  let ideaContext: { id: string; title: string; pitch: string } | null = null;
  if (params.idea) {
    const { data: idea } = await supabase
      .from("ideas")
      .select("id, title, pitch")
      .eq("id", params.idea)
      .single();
    if (idea) ideaContext = idea;
  }

  // Event context
  let eventContext: { id: string; title: string } | null = null;
  if (params.event) {
    const { data: event } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", params.event)
      .single();
    if (event) eventContext = event;
  }

  return (
    <div className="py-4">
      <PlanningIntro ideaName={ideaContext?.title ?? null} />
      <PlanningFlowWrapper
        userId={user.id}
        profileName={profile?.full_name}
        eventId={eventContext?.id}
        eventName={eventContext?.title}
        ideaId={ideaContext?.id}
        ideaName={ideaContext?.title}
        ideaPitch={ideaContext?.pitch}
        buildTool={params.tool ?? "lovable"}
      />
    </div>
  );
}

/**
 * Sets expectations before the conversation starts. Hidden once a brief
 * exists - at that point the page is the Blueprint itself, not the
 * planning onramp. Doc-tone, plain prose, no jargon.
 */
function PlanningIntro({ ideaName }: { ideaName?: string | null } = {}) {
  return (
    <div className="max-w-[var(--container-narrow)] mx-auto mb-10">
      <p className="mono-label mb-3" style={{ color: "var(--text-secondary)" }}>
        Plan Your Build
      </p>
      <h1
        className="font-serif text-[28px] leading-tight mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        {ideaName
          ? `Let's shape ${ideaName} into a Blueprint you can build from.`
          : "Let's shape your idea into a Blueprint you can build from."}
      </h1>
      <p
        className="font-serif text-[17px] leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        Talk it through with a thinking partner - no forms, no steps to march
        through. Over the conversation we&apos;ll cover what it does, who
        it&apos;s for, how it should feel, the one thing it has to do, and what
        done looks like. The end result is your <strong>Blueprint</strong> - a
        focused document you can hand to Lovable, Cursor, or any AI build tool,
        plus a Starter Prompt to kick off the build. When you&apos;re ready,
        hit <em>Generate my Blueprint</em> below the conversation.
      </p>
    </div>
  );
}
