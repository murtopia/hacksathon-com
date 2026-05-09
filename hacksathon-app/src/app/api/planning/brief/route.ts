import { generateText } from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { planningModel } from "@/lib/ai/model";
import {
  rowToSession,
  toAIMessages,
  buildParticipantContext,
} from "@/lib/planning/context";
import {
  buildSystemPrompt,
  BRIEF_GENERATION_INSTRUCTION,
} from "@/lib/planning/prompts";

export const maxDuration = 60;

interface BriefData {
  projectName: string;
  oneSentenceScope: string;
  targetUser: string;
  coreFeature: string;
  designVibe: string | null;
  referenceUrl: string | null;
  colorToneNotes: string | null;
  outOfScope: string;
  doneLooksLike: string;
  prdMarkdown: string;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planningSessionId, regenerate } = await req.json();

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

  const userInstruction = regenerate
    ? "The participant has refined their thinking after generating the original PRD. Re-synthesize the Project Brief from the FULL conversation above, including everything they've said since the last PRD was generated. Return ONLY the JSON object."
    : "Generate the participant's Project Brief from our full conversation above. Return ONLY the JSON object.";

  let text: string;
  try {
    const result = await generateText({
      model: planningModel,
      system: `${systemPrompt}\n\n---\n\n${BRIEF_GENERATION_INSTRUCTION}`,
      messages: [
        ...aiMessages,
        {
          role: "user",
          content: userInstruction,
        },
      ],
      maxOutputTokens: 4000,
    });
    text = result.text;
  } catch (error) {
    // Make model failures loud in Vercel logs and surface a 502 to the
    // client. The PRD step is non-streaming, so the client can show a
    // clear error toast instead of guessing.
    console.error("[planning/brief] generateText failed", {
      sessionId: session.id,
      regenerate: !!regenerate,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error:
          "We couldn't generate your PRD right now. Please try again in a moment.",
      },
      { status: 502 }
    );
  }

  let briefData: BriefData;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    briefData = JSON.parse(jsonMatch[0]) as BriefData;
  } catch {
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
      prdMarkdown: buildFallbackMarkdown({
        projectName: ideaName ?? "Untitled Project",
        whatItDoes: session.stepAnswers.step1 ?? "",
        whoItsFor: session.stepAnswers.step2 ?? "",
        howItFeels: session.stepAnswers.step3?.vibe ?? "",
        oneThing: session.stepAnswers.step4 ?? "",
        doneWhen: session.stepAnswers.step5 ?? "",
      }),
    };
  }

  const briefPayload = {
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
    prd_markdown: briefData.prdMarkdown,
  };

  if (regenerate && session.briefId) {
    const { data: updated, error: updateError } = await supabase
      .from("project_briefs")
      .update({
        ...briefPayload,
        version: ((sessionRow.brief_version as number) ?? 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.briefId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Failed to update brief" },
        { status: 500 }
      );
    }

    await supabase
      .from("planning_sessions")
      .update({
        starter_prompt_text: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return NextResponse.json({ brief: updated });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("project_briefs")
    .insert(briefPayload)
    .select()
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create brief" },
      { status: 500 }
    );
  }

  await supabase
    .from("planning_sessions")
    .update({
      brief_id: inserted.id,
      status: "complete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  return NextResponse.json({ brief: inserted });
}

function buildFallbackMarkdown(args: {
  projectName: string;
  whatItDoes: string;
  whoItsFor: string;
  howItFeels: string;
  oneThing: string;
  doneWhen: string;
}): string {
  return `# ${args.projectName} — Project Brief

## 🎯 What It Does
${args.whatItDoes || "_(Not yet captured.)_"}

## 👥 Who It's For
${args.whoItsFor || "_(Not yet captured.)_"}

## ✨ How It Should Feel
${args.howItFeels || "_(Not yet captured.)_"}

## ⚡ The One Thing
${args.oneThing || "_(Not yet captured.)_"}

## ✅ Done When
${args.doneWhen || "_(Not yet captured.)_"}
`;
}
