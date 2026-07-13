import { generateObject } from "ai";
import { z } from "zod";
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

// Blueprint synthesis of a long conversation legitimately runs 45-90s;
// the old 60s cap was killing slow-but-healthy generations mid-write
// (Vercel 504 "Task timed out after 60 seconds"). Fluid Compute allows
// up to 300s, so 180s gives real headroom without letting a truly hung
// call burn forever.
export const maxDuration = 180;

/**
 * Schema-enforced Blueprint payload. generateObject drives Anthropic's
 * tool-calling mode, so the model structurally cannot return prose or
 * malformed JSON - the historical failure mode where a regex JSON.parse
 * failed and a silently-empty Blueprint got saved.
 */
const briefSchema = z.object({
  projectName: z.string().describe("The project's name"),
  oneSentenceScope: z
    .string()
    .describe("One sentence describing what this does and for whom"),
  targetUser: z
    .string()
    .describe("A specific, vivid description of the target user"),
  coreFeature: z
    .string()
    .describe("The single most important thing this build does"),
  designVibe: z
    .string()
    .nullable()
    .describe("The visual feel/mood described in the conversation"),
  referenceUrl: z
    .string()
    .nullable()
    .describe("Any reference URL they shared"),
  colorToneNotes: z
    .string()
    .nullable()
    .describe("Color preferences or tone notes"),
  outOfScope: z
    .string()
    .describe(
      "Clean list of what's explicitly NOT in v1, one per line, prefixed with '- '",
    ),
  doneLooksLike: z
    .string()
    .describe("Their specific done state, refined for clarity"),
  prdMarkdown: z
    .string()
    .describe(
      "The full consolidated Blueprint as markdown, following the section template exactly",
    ),
});

type BriefData = z.infer<typeof briefSchema>;

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
    ? "The participant has refined their thinking after generating the original Blueprint. Re-synthesize the Blueprint from the FULL conversation above, including everything they've said since the last Blueprint was generated. Return ONLY the JSON object."
    : "Generate the participant's Blueprint from our full conversation above. Return ONLY the JSON object.";

  let briefData: BriefData;
  try {
    const runGenerate = () =>
      generateObject({
        model: planningModel,
        schema: briefSchema,
        system: `${systemPrompt}\n\n---\n\n${BRIEF_GENERATION_INSTRUCTION}`,
        messages: [
          ...aiMessages,
          {
            role: "user",
            content: userInstruction,
          },
        ],
        maxOutputTokens: 6000,
      });

    let result: Awaited<ReturnType<typeof runGenerate>>;
    try {
      result = await runGenerate();
    } catch (firstError) {
      // One quick retry to ride out transient model hiccups (overload,
      // rate limit, blip) before surfacing an error to the participant.
      // This is the failure mode where a manual "Retry" used to work.
      console.warn("[planning/brief] generateObject retrying after error", {
        sessionId: session.id,
        error:
          firstError instanceof Error ? firstError.message : String(firstError),
      });
      // Anthropic overloads usually need a few seconds to clear; with a
      // 180s budget we can afford a real pause before the retry.
      await new Promise((resolve) => setTimeout(resolve, 3000));
      result = await runGenerate();
    }
    briefData = result.object;
  } catch (error) {
    // Make model failures loud in Vercel logs and surface a 502 to the
    // client. The Blueprint step is non-streaming, so the client can show
    // a clear error toast instead of guessing. Never fall back to saving
    // a placeholder Blueprint - an error the participant can retry beats
    // a confident-looking empty document marked complete.
    console.error("[planning/brief] generateObject failed", {
      sessionId: session.id,
      regenerate: !!regenerate,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error:
          "We couldn't generate your Blueprint right now. Please try again in a moment.",
      },
      { status: 502 }
    );
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
    // Version lives on project_briefs, not the session row - read the
    // current value so repeated regenerations actually increment.
    const { data: currentBrief } = await supabase
      .from("project_briefs")
      .select("version")
      .eq("id", session.briefId)
      .single<{ version: number }>();

    const { data: updated, error: updateError } = await supabase
      .from("project_briefs")
      .update({
        ...briefPayload,
        version: (currentBrief?.version ?? 1) + 1,
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
