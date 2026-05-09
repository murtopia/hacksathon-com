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

  // Idea context (Scenario A — pre-load project name + pitch)
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
