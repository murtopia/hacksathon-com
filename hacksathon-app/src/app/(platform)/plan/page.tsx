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
  searchParams: Promise<{ session?: string; event?: string; idea?: string; tool?: string; revise?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;

  // If a session ID is provided, load it
  if (params.session) {
    const { data: sessionRow } = await supabase
      .from("planning_sessions")
      .select("*")
      .eq("id", params.session)
      .single();

    if (sessionRow && sessionRow.user_id === user.id) {
      return (
        <div className="py-4">
          <PlanningFlowWrapper existingSession={sessionRow} />
        </div>
      );
    }
  }

  // Load the user's profile for context
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // If revise mode, load the existing brief
  let existingBrief = null;
  if (params.revise) {
    const { data: brief } = await supabase
      .from("project_briefs")
      .select("*, planning_sessions(*)")
      .eq("id", params.revise)
      .single();

    if (brief && brief.user_id === user.id) {
      existingBrief = brief;
    }
  }

  // Load idea context if provided
  let ideaContext = null;
  if (params.idea) {
    const { data: idea } = await supabase
      .from("ideas")
      .select("id, title, pitch")
      .eq("id", params.idea)
      .single();
    if (idea) ideaContext = idea;
  }

  // Load event context if provided
  let eventContext = null;
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
        reviseMode={!!existingBrief}
        existingBriefId={existingBrief?.id}
      />
    </div>
  );
}
