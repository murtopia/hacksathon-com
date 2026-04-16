import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const BUILD_TOOL_LABELS: Record<string, string> = {
  lovable: "Lovable",
  cursor: "Cursor",
  bolt: "Bolt",
  replit: "Replit",
  v0: "v0",
  any: "an AI coding tool",
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planningSessionId } = await req.json();

  // Load the session
  const { data: session, error: sessionError } = await supabase
    .from("planning_sessions")
    .select("*, project_briefs!planning_sessions_brief_id_fkey(*)")
    .eq("id", planningSessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If we already have a cached starter prompt and the brief hasn't changed, return it
  if (session.starter_prompt_text) {
    return NextResponse.json({
      starterPrompt: session.starter_prompt_text,
      cached: true,
    });
  }

  const brief = session.project_briefs;
  if (!brief) {
    return NextResponse.json(
      { error: "No brief generated yet" },
      { status: 400 }
    );
  }

  const toolLabel = BUILD_TOOL_LABELS[session.build_tool] ?? session.build_tool;

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6-20250514"),
    system: `You generate starter prompts for non-technical people to paste into ${toolLabel} to begin building their project. The prompt must be plain text — no markdown, no code fences, no headers. It should read like clear instructions to a builder.`,
    messages: [
      {
        role: "user",
        content: `Generate a starter prompt for this project. The user will paste this into ${toolLabel} to begin building.

Project Brief:
- Name: ${brief.project_name}
- Scope: ${brief.one_sentence_scope}
- Target User: ${brief.target_user}
- Core Feature: ${brief.core_feature}
- Design Direction: ${brief.design_vibe ?? "not specified"}
- Reference: ${brief.reference_url ?? "none"}
- Color/Tone: ${brief.color_tone_notes ?? "not specified"}
- Out of Scope: ${brief.out_of_scope}
- Done State: ${brief.done_looks_like}

Write a clear, specific prompt that tells ${toolLabel} exactly what to build. Include the project name, what it does, who it's for, how it should look, what to include, and what NOT to include. Keep it under 300 words. Plain text only — no markdown formatting.`,
      },
    ],
    maxOutputTokens: 500,
  });

  // Cache the result
  await supabase
    .from("planning_sessions")
    .update({
      starter_prompt_text: text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  return NextResponse.json({ starterPrompt: text, cached: false });
}
