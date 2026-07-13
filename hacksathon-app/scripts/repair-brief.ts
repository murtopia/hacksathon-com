/**
 * One-off repair: re-synthesize the Blueprint for a planning session whose
 * brief was saved as the empty "(Not yet captured.)" fallback template.
 * Mirrors the regenerate path of /api/planning/brief using the app's own
 * prompt/model/context modules, but runs with the service-role key.
 *
 * Usage: npx tsx scripts/repair-brief.ts <planning_session_id>
 */
import { createClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { z } from "zod";
import { planningModel } from "../src/lib/ai/model";
import {
  rowToSession,
  toAIMessages,
  buildParticipantContext,
} from "../src/lib/planning/context";
import {
  buildSystemPrompt,
  BRIEF_GENERATION_INSTRUCTION,
} from "../src/lib/planning/prompts";

const briefSchema = z.object({
  projectName: z.string(),
  oneSentenceScope: z.string(),
  targetUser: z.string(),
  coreFeature: z.string(),
  designVibe: z.string().nullable(),
  referenceUrl: z.string().nullable(),
  colorToneNotes: z.string().nullable(),
  outOfScope: z.string(),
  doneLooksLike: z.string(),
  prdMarkdown: z.string(),
});

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) throw new Error("Pass the planning_session_id as arg 1");

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: sessionRow, error } = await admin
    .from("planning_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (error || !sessionRow) throw new Error(`Session not found: ${error?.message}`);

  const session = rowToSession(sessionRow);
  if (!session.briefId) throw new Error("Session has no brief to repair");

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", session.userId)
    .single();

  let ideaName: string | null = null;
  let ideaPitch: string | null = null;
  if (session.ideaId) {
    const { data: idea } = await admin
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
    const { data: event } = await admin
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

  console.log(`Synthesizing from ${session.conversationHistory.length} messages...`);

  const { object: briefData } = await generateObject({
    model: planningModel,
    schema: briefSchema,
    system: `${buildSystemPrompt(participantCtx)}\n\n---\n\n${BRIEF_GENERATION_INSTRUCTION}`,
    messages: [
      ...toAIMessages(session.conversationHistory),
      {
        role: "user",
        content:
          "Generate the participant's Blueprint from our full conversation above. Return ONLY the JSON object.",
      },
    ],
    maxOutputTokens: 6000,
  });

  const { data: currentBrief } = await admin
    .from("project_briefs")
    .select("version")
    .eq("id", session.briefId)
    .single<{ version: number }>();

  const { error: updateError } = await admin
    .from("project_briefs")
    .update({
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
      version: (currentBrief?.version ?? 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.briefId);
  if (updateError) throw new Error(updateError.message);

  // Starter prompt was cached against the old (empty) brief - clear it so
  // it regenerates from the repaired one.
  await admin
    .from("planning_sessions")
    .update({ starter_prompt_text: null, updated_at: new Date().toISOString() })
    .eq("id", session.id);

  console.log(`Updated brief ${session.briefId}`);
  console.log(`prd_markdown length: ${briefData.prdMarkdown.length}`);
  console.log(briefData.prdMarkdown.slice(0, 400));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
