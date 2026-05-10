import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planningSessionId } = await req.json();

  // Note: planning_sessions has TWO foreign keys to project_briefs
  // (brief_id and existing_brief_id), so we can't rely on PostgREST's
  // implicit foreign-key joins. Fetch the session and brief in two
  // explicit steps instead — this also keeps the route resilient if a
  // session has a stale brief_id.
  const { data: session, error: sessionError } = await supabase
    .from("planning_sessions")
    .select("*")
    .eq("id", planningSessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.starter_prompt_text) {
    return NextResponse.json({
      starterPrompt: session.starter_prompt_text,
      cached: true,
    });
  }

  if (!session.brief_id) {
    return NextResponse.json(
      { error: "No Blueprint generated yet" },
      { status: 400 }
    );
  }

  const { data: brief, error: briefError } = await supabase
    .from("project_briefs")
    .select("*")
    .eq("id", session.brief_id)
    .single();

  if (briefError || !brief) {
    return NextResponse.json(
      { error: "Blueprint not found" },
      { status: 404 }
    );
  }

  const starterPrompt = buildStarterPrompt({
    projectName: brief.project_name,
    oneSentenceScope: brief.one_sentence_scope,
    targetUser: brief.target_user,
    coreFeature: brief.core_feature,
    designVibe: brief.design_vibe,
    referenceUrl: brief.reference_url,
    doneLooksLike: brief.done_looks_like,
  });

  await supabase
    .from("planning_sessions")
    .update({
      starter_prompt_text: starterPrompt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  return NextResponse.json({ starterPrompt, cached: false });
}

/**
 * Synthesize the Starter Prompt from brief fields using the doc's verbatim template.
 * Plain text — no markdown, no fences. Designed to paste directly into a build tool.
 */
function buildStarterPrompt(args: {
  projectName: string;
  oneSentenceScope: string;
  targetUser: string;
  coreFeature: string;
  designVibe: string | null;
  referenceUrl: string | null;
  doneLooksLike: string;
}): string {
  const designLine = [args.designVibe, args.referenceUrl]
    .filter((v) => v && v.trim().length > 0)
    .join(" — ");

  return `I'm building an app called ${args.projectName}.

Here's what it is: ${args.oneSentenceScope}

It's for: ${args.targetUser}

The one thing it needs to do: ${args.coreFeature}

${designLine ? `Design direction: ${designLine}\n\n` : ""}For this first build, only this needs to work: ${args.doneLooksLike}

Start there and nothing else. Don't add features I haven't asked for.

I'm attaching my Blueprint — please read it before you start building.`;
}
