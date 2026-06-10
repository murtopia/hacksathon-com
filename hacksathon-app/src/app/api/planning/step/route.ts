import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { planningModel } from "@/lib/ai/model";
import {
  rowToSession,
  appendMessage,
  toAIMessages,
  buildParticipantContext,
} from "@/lib/planning/context";
import { buildSystemPrompt, buildPostPrdPrompt } from "@/lib/planning/prompts";
import type { Message } from "@/lib/planning/types";

export const maxDuration = 60;

/**
 * The planning conversation is one continuous chat - no per-step gating.
 * The only thing this route does on each turn is:
 *   1. (optionally) append the user's new message to history
 *   2. stream an AI response with the conversation as context
 *   3. persist the assistant's reply on finish
 *
 * Calling without `userMessage` is a retry - re-streams from the existing
 * history without mutating it again.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const {
    planningSessionId,
    userMessage,
  }: {
    planningSessionId: string;
    userMessage?: string;
  } = body;

  const { data: sessionRow, error: sessionError } = await supabase
    .from("planning_sessions")
    .select("*")
    .eq("id", planningSessionId)
    .single();

  if (sessionError || !sessionRow) {
    return new Response("Session not found", { status: 404 });
  }

  const session = rowToSession(sessionRow);

  if (session.userId !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  // Participant context
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
    if (event) {
      eventName = event.title;
    }
  }

  const participantCtx = buildParticipantContext({
    profileName: profile?.full_name,
    ideaName,
    ideaPitch,
    buildTool: session.buildTool,
    eventName,
  });

  let systemPrompt = buildSystemPrompt(participantCtx);

  // Post-Blueprint continuation: if a Blueprint already exists, load it
  // and inject as context. The conversation stays open - same session,
  // same history - but the AI now treats the Blueprint as the source of
  // truth and helps the participant describe targeted changes.
  const isPostPrd = session.status === "complete" && session.briefId;
  if (isPostPrd) {
    const { data: existingBrief } = await supabase
      .from("project_briefs")
      .select("prd_markdown, project_name")
      .eq("id", session.briefId!)
      .single();

    if (existingBrief?.prd_markdown) {
      systemPrompt += "\n\n" + buildPostPrdPrompt(existingBrief.prd_markdown);
    }
  }

  let history = session.conversationHistory;

  // Append the user's new message (skip if this is a retry - no userMessage).
  if (userMessage) {
    const userMsg: Message = {
      role: "user",
      content: userMessage,
      messageType: "user_response",
    };
    history = appendMessage(history, userMsg);

    await supabase
      .from("planning_sessions")
      .update({
        conversation_history: history,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
  }

  const aiMessages = toAIMessages(history);

  const result = streamText({
    model: planningModel,
    system: systemPrompt,
    messages:
      aiMessages.length > 0
        ? aiMessages
        : [{ role: "user", content: "[Start the planning conversation]" }],
    onError: ({ error }) => {
      // Surface model failures (deprecation, rate limits, malformed
      // requests) loudly in Vercel logs instead of swallowing them.
      // Client-side picks this up via an empty stream + retry UI.
      console.error("[planning/step] streamText error", {
        sessionId: session.id,
        isPostPrd,
        error: error instanceof Error ? error.message : String(error),
      });
    },
    onFinish: async ({ text }) => {
      // Guard against persisting empty assistant turns. When the model
      // call errors before producing any text, onFinish still fires -
      // committing an empty bubble would be worse than nothing because
      // it visibly breaks the conversation.
      const trimmed = text?.trim();
      if (!trimmed) return;

      const assistantMsg: Message = {
        role: "assistant",
        content: text,
        messageType: "reflection",
      };

      const updatedHistory = appendMessage(history, assistantMsg);

      await supabase
        .from("planning_sessions")
        .update({
          conversation_history: updatedHistory,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    },
  });

  return result.toTextStreamResponse({
    headers: {
      "X-Planning-Post-Prd": String(isPostPrd),
    },
  });
}
