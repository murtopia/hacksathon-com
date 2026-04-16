import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToSession, toAIMessages, buildParticipantContext } from "@/lib/planning/context";
import { buildSystemPrompt, BUILD_NOTES_INSTRUCTION } from "@/lib/planning/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planningSessionId, projectBriefId } = await req.json();

  const { data: sessionRow, error: sessionError } = await supabase
    .from("planning_sessions")
    .select("*")
    .eq("id", planningSessionId)
    .single();

  if (sessionError || !sessionRow) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = rowToSession(sessionRow);

  if (session.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build context
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  let ideaName: string | null = null;
  if (session.ideaId) {
    const { data: idea } = await supabase
      .from("ideas")
      .select("title")
      .eq("id", session.ideaId)
      .single();
    if (idea) ideaName = idea.title;
  }

  let eventName: string | null = null;
  if (session.eventId) {
    const { data: event } = await supabase
      .from("events")
      .select("title")
      .eq("id", session.eventId)
      .single();
    if (event) eventName = event.title;
  }

  const participantCtx = buildParticipantContext({
    profileName: profile?.full_name,
    ideaName,
    buildTool: session.buildTool,
    eventName,
  });

  const systemPrompt = buildSystemPrompt(participantCtx);
  const aiMessages = toAIMessages(session.conversationHistory);

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6-20250514"),
    system: `${systemPrompt}\n\n---\n\n${BUILD_NOTES_INSTRUCTION}`,
    messages: [
      ...aiMessages,
      {
        role: "user",
        content:
          "Analyze the full planning conversation and generate Build Notes. Return ONLY the JSON object.",
      },
    ],
    maxTokens: 800,
  });

  let notesData;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    notesData = JSON.parse(jsonMatch[0]);
  } catch {
    // If generation fails, return empty — the UI hides Build Notes silently
    return NextResponse.json({ buildNotes: null });
  }

  const { data: buildNotes, error: notesError } = await supabase
    .from("build_notes")
    .insert({
      planning_session_id: session.id,
      project_brief_id: projectBriefId,
      user_id: user.id,
      tensions: notesData.tensions ?? [],
      considerations: notesData.considerations ?? [],
      assumptions: notesData.assumptions ?? [],
      v1_scope_suggestion: notesData.v1ScopeSuggestion ?? null,
    })
    .select()
    .single();

  if (notesError) {
    return NextResponse.json({ buildNotes: null });
  }

  // Update the session with the build notes ID
  await supabase
    .from("planning_sessions")
    .update({
      build_notes_id: buildNotes.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  return NextResponse.json({ buildNotes });
}
