import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToSession, toAIMessages, buildParticipantContext } from "@/lib/planning/context";
import { buildSystemPrompt, BRIEF_GENERATION_INSTRUCTION } from "@/lib/planning/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planningSessionId } = await req.json();

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
  let ideaPitch: string | null = null;
  if (session.ideaId) {
    const { data: idea } = await supabase
      .from("ideas")
      .select("title, pitch")
      .eq("id", session.ideaId)
      .single();
    if (idea) {
      ideaName = idea.title;
      ideaPitch = idea.pitch;
    }
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
    ideaPitch,
    buildTool: session.buildTool,
    eventName,
  });

  const systemPrompt = buildSystemPrompt(participantCtx);
  const aiMessages = toAIMessages(session.conversationHistory);

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6-20250514"),
    system: `${systemPrompt}\n\n---\n\n${BRIEF_GENERATION_INSTRUCTION}`,
    messages: [
      ...aiMessages,
      {
        role: "user",
        content:
          "Generate my Project Brief from our full conversation above. Return ONLY the JSON object.",
      },
    ],
    maxOutputTokens: 1000,
  });

  // Parse the JSON response
  let briefData;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    briefData = JSON.parse(jsonMatch[0]);
  } catch {
    // Fallback: assemble from step answers
    briefData = {
      projectName: ideaName ?? "Untitled Project",
      oneSentenceScope: session.stepAnswers.step1 ?? "",
      targetUser: session.stepAnswers.step2 ?? "",
      coreFeature: session.stepAnswers.step1 ?? "",
      designVibe: session.stepAnswers.step3?.vibe ?? null,
      referenceUrl: session.stepAnswers.step3?.referenceUrl ?? null,
      colorToneNotes: session.stepAnswers.step3?.colorNotes ?? null,
      outOfScope: session.stepAnswers.step4 ?? "",
      doneLooksLike: session.stepAnswers.step5 ?? "",
    };
  }

  // Insert the project brief
  const { data: brief, error: briefError } = await supabase
    .from("project_briefs")
    .insert({
      event_id: session.eventId,
      user_id: user.id,
      idea_id: session.ideaId,
      planning_session_id: session.id,
      project_name: briefData.projectName,
      one_sentence_scope: briefData.oneSentenceScope,
      target_user: briefData.targetUser,
      core_feature: briefData.coreFeature,
      design_vibe: briefData.designVibe,
      reference_url: briefData.referenceUrl,
      color_tone_notes: briefData.colorToneNotes,
      out_of_scope: briefData.outOfScope,
      done_looks_like: briefData.doneLooksLike,
    })
    .select()
    .single();

  if (briefError) {
    return NextResponse.json({ error: briefError.message }, { status: 500 });
  }

  // Update the session with the brief ID and mark complete
  await supabase
    .from("planning_sessions")
    .update({
      brief_id: brief.id,
      status: "complete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  return NextResponse.json({ brief });
}
