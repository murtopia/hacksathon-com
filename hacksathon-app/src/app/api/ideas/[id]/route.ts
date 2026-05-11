import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToIdea, type IdeaStatus } from "@/lib/idealab/types";
import { isValidHttpUrl } from "@/lib/idealab/url";

const VALID_STATUSES: IdeaStatus[] = [
  "idea_stage",
  "in_progress",
  "completed",
];

/**
 * PATCH /api/ideas/[id]
 *
 * Owner-only edit. RLS already gates writes to user_id = auth.uid(),
 * but we also guard the demo-ready transition: status='completed'
 * requires both live_url and final_screenshot_url. The DB CHECK
 * constraint enforces this too — we duplicate it here so the user
 * gets a friendly error instead of a Postgres exception bubbling
 * through.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Load the existing idea so we can validate transitions against its
  // current persisted state (caller may only send a partial patch).
  const { data: existing, error: fetchError } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    if (!body.title.trim()) {
      return NextResponse.json(
        { error: "Project name can't be empty" },
        { status: 400 }
      );
    }
    updates.title = body.title.trim();
  }

  if (typeof body.pitch === "string") {
    if (!body.pitch.trim()) {
      return NextResponse.json(
        { error: "The teaser line can't be empty" },
        { status: 400 }
      );
    }
    updates.pitch = body.pitch.trim();
  }

  if ("description" in body) {
    updates.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  }

  if ("liveUrl" in body) {
    const trimmed =
      typeof body.liveUrl === "string" ? body.liveUrl.trim() : "";
    if (trimmed && !isValidHttpUrl(trimmed)) {
      return NextResponse.json(
        { error: "Live URL must start with http:// or https://" },
        { status: 400 }
      );
    }
    updates.live_url = trimmed || null;
  }

  if ("finalScreenshotUrl" in body) {
    updates.final_screenshot_url =
      typeof body.finalScreenshotUrl === "string" &&
      body.finalScreenshotUrl.trim()
        ? body.finalScreenshotUrl.trim()
        : null;
  }

  if ("heroCropX" in body) {
    const raw = body.heroCropX;
    if (
      typeof raw !== "number" ||
      !Number.isInteger(raw) ||
      raw < 0 ||
      raw > 100
    ) {
      return NextResponse.json(
        { error: "heroCropX must be an integer between 0 and 100" },
        { status: 400 }
      );
    }
    updates.hero_crop_x = raw;
  }

  if ("heroCropY" in body) {
    const raw = body.heroCropY;
    if (
      typeof raw !== "number" ||
      !Number.isInteger(raw) ||
      raw < 0 ||
      raw > 100
    ) {
      return NextResponse.json(
        { error: "heroCropY must be an integer between 0 and 100" },
        { status: 400 }
      );
    }
    updates.hero_crop_y = raw;
  }

  if ("status" in body) {
    if (
      typeof body.status !== "string" ||
      !VALID_STATUSES.includes(body.status as IdeaStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    if (body.status === "completed") {
      // Use the about-to-be-saved values, falling back to existing.
      const liveUrl =
        "live_url" in updates ? updates.live_url : existing.live_url;
      const screenshotUrl =
        "final_screenshot_url" in updates
          ? updates.final_screenshot_url
          : existing.final_screenshot_url;

      if (!liveUrl || !screenshotUrl) {
        return NextResponse.json(
          {
            error:
              "Add a live URL and a final screenshot before marking this Completed.",
          },
          { status: 400 }
        );
      }
    }

    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  updates.updated_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("ideas")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[api/ideas/:id] update failed", updateError);
    return NextResponse.json(
      { error: updateError?.message ?? "Failed to update idea" },
      { status: 500 }
    );
  }

  return NextResponse.json({ idea: rowToIdea(updated) });
}
