import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildNewSessionRow, rowToSession } from "@/lib/planning/context";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const row = buildNewSessionRow({
    userId: user.id,
    eventId: body.eventId,
    ideaId: body.ideaId,
    buildTool: body.buildTool,
    mode: body.mode,
    existingBriefId: body.existingBriefId,
  });

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
