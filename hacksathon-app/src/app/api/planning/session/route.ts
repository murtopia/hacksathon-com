import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildNewSessionRow, rowToSession } from "@/lib/planning/context";
import { buildStep1Opening } from "@/lib/planning/prompts";
import type { Message } from "@/lib/planning/types";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Per the planning spec: there is no formal "revise" mode. Any returning
  // exchange continues the existing session. New sessions always start
  // from the structured 5-step flow.
  const row = buildNewSessionRow({
    userId: user.id,
    eventId: body.eventId,
    ideaId: body.ideaId,
    buildTool: body.buildTool,
  });

  // Look up the IdeaLab entry so we can seed Step 1's opening with the
  // real project name (Scenario A) — or fall back to Scenario B prompting
  // for a working title. Either way, the opening is deterministic and
  // never depends on a model call. This removes a class of silent
  // failures from the very first thing a participant sees on /plan.
  let ideaName: string | null = null;
  if (body.ideaId) {
    const { data: idea } = await supabase
      .from("ideas")
      .select("title")
      .eq("id", body.ideaId)
      .single();
    if (idea?.title) ideaName = idea.title;
  }

  const openingMessage: Message = {
    role: "assistant",
    content: buildStep1Opening(ideaName),
    stepNumber: 1,
    messageType: "question",
  };
  row.conversation_history = [openingMessage];

  const { data, error } = await supabase
    .from("planning_sessions")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: rowToSession(data) });
}
