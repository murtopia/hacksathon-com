import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import { isReservedSlug } from "@/lib/routing/reserved-slugs";
import { isValidHttpUrl } from "@/lib/idealab/url";

export const maxDuration = 15;

/**
 * Update event basics + branding + settings. Admin-only.
 *
 * Accepts a partial payload - any provided fields are validated and
 * written, omitted fields are left alone. `settings` merges with the
 * existing JSONB (shallow) so callers don't have to round-trip the
 * whole object.
 *
 * Vanity-slug validation:
 *   - Lowercased + URL-shape checked (^[a-z0-9-]{3,40}$).
 *   - Reserved slugs (api, login, etc.) refused.
 *   - Uniqueness checked against events.vanity_slug - case-insensitive.
 *
 * Lock guard: if events.is_locked = true, every field except the
 * settings.slack_url update is blocked. Organizers can still adjust the
 * team-chat link after lock so post-event handoffs work.
 */

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

// Free-form text. The DB constraint (00023_event_build_tool_freeform.sql)
// enforces non-empty + length <= 50; we mirror that here so the admin
// gets a friendly error before the round-trip. Recognized vs.
// unrecognized handling lives in src/lib/build-tool/labels.ts.
const BUILD_TOOL_MAX_LENGTH = 50;

interface UpdatePayload {
  title?: string;
  description?: string | null;
  welcome_message?: string | null;
  welcome_video_url?: string | null;
  vanity_slug?: string | null;
  public_showcase?: boolean;
  build_tool?: string;
  settings?: Record<string, unknown> | null;
  voting_open_at?: string | null;
  voting_close_at?: string | null;
  reflections_open_at?: string | null;
  reflections_close_at?: string | null;
}

const DATE_COLUMNS: (keyof UpdatePayload)[] = [
  "voting_open_at",
  "voting_close_at",
  "reflections_open_at",
  "reflections_close_at",
];

function parseIsoTimestamp(
  value: string | null,
  field: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") {
    return { ok: false, error: `${field} must be an ISO timestamp string.` };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, error: `${field} isn't a valid date.` };
  }
  return { ok: true, value: parsed.toISOString() };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let body: UpdatePayload;
  try {
    body = (await req.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("events")
    .select("is_locked, settings, vanity_slug")
    .eq("id", eventId)
    .single<{
      is_locked: boolean;
      settings: Record<string, unknown> | null;
      vanity_slug: string | null;
    }>();

  if (!current) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const trimmed = body.title.trim();
    if (trimmed.length < 2 || trimmed.length > 120) {
      return NextResponse.json(
        { error: "Title must be between 2 and 120 characters." },
        { status: 400 },
      );
    }
    if (current.is_locked) {
      return NextResponse.json(
        { error: "Event is locked - title can't be changed." },
        { status: 409 },
      );
    }
    updates.title = trimmed;
  }

  if (body.description !== undefined) {
    if (current.is_locked) {
      return NextResponse.json(
        { error: "Event is locked - description can't be changed." },
        { status: 409 },
      );
    }
    updates.description =
      body.description === null
        ? null
        : String(body.description).slice(0, 5000);
  }

  if (body.welcome_message !== undefined) {
    if (current.is_locked) {
      return NextResponse.json(
        { error: "Event is locked - welcome message can't be changed." },
        { status: 409 },
      );
    }
    updates.welcome_message =
      body.welcome_message === null
        ? null
        : String(body.welcome_message).slice(0, 2000);
  }

  if (body.welcome_video_url !== undefined) {
    if (current.is_locked) {
      return NextResponse.json(
        { error: "Event is locked - welcome video can't be changed." },
        { status: 409 },
      );
    }
    if (body.welcome_video_url === null || body.welcome_video_url === "") {
      updates.welcome_video_url = null;
    } else if (
      typeof body.welcome_video_url === "string" &&
      isValidHttpUrl(body.welcome_video_url)
    ) {
      updates.welcome_video_url = body.welcome_video_url;
    } else {
      return NextResponse.json(
        { error: "Welcome video URL must start with http:// or https://" },
        { status: 400 },
      );
    }
  }

  if (body.vanity_slug !== undefined) {
    if (current.is_locked) {
      return NextResponse.json(
        { error: "Event is locked - vanity URL can't be changed." },
        { status: 409 },
      );
    }
    if (body.vanity_slug === null || body.vanity_slug === "") {
      updates.vanity_slug = null;
    } else {
      const slug = String(body.vanity_slug).trim().toLowerCase();
      if (!SLUG_PATTERN.test(slug)) {
        return NextResponse.json(
          {
            error:
              "Vanity URL can only contain lowercase letters, numbers, and hyphens (3–40 chars).",
          },
          { status: 400 },
        );
      }
      if (isReservedSlug(slug)) {
        return NextResponse.json(
          { error: "That URL is reserved by Hacksathon.com." },
          { status: 409 },
        );
      }
      const { data: collision } = await admin
        .from("events")
        .select("id")
        .ilike("vanity_slug", slug)
        .neq("id", eventId)
        .maybeSingle();
      if (collision) {
        return NextResponse.json(
          { error: "That URL is already taken." },
          { status: 409 },
        );
      }
      updates.vanity_slug = slug;
    }
  }

  if (typeof body.public_showcase === "boolean") {
    updates.public_showcase = body.public_showcase;
  }

  if (body.build_tool !== undefined) {
    if (current.is_locked) {
      return NextResponse.json(
        { error: "Event is locked - build tool can't be changed." },
        { status: 409 },
      );
    }
    if (typeof body.build_tool !== "string") {
      return NextResponse.json(
        { error: "Build tool must be a string." },
        { status: 400 },
      );
    }
    const trimmed = body.build_tool.trim();
    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: "Build tool can't be blank." },
        { status: 400 },
      );
    }
    if (trimmed.length > BUILD_TOOL_MAX_LENGTH) {
      return NextResponse.json(
        {
          error: `Build tool name is too long (max ${BUILD_TOOL_MAX_LENGTH} characters).`,
        },
        { status: 400 },
      );
    }
    updates.build_tool = trimmed;
  }

  for (const field of DATE_COLUMNS) {
    if (body[field] === undefined) continue;
    if (current.is_locked && field.startsWith("voting_")) {
      return NextResponse.json(
        { error: "Event is locked - voting window can't be changed." },
        { status: 409 },
      );
    }
    const parsed = parseIsoTimestamp(
      (body[field] as string | null) ?? null,
      field,
    );
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    updates[field] = parsed.value;
  }

  if (body.settings !== undefined) {
    const next: Record<string, unknown> = {
      ...(current.settings ?? {}),
    };
    if (body.settings === null) {
      // Allow explicit clear of everything.
      updates.settings = {};
    } else if (typeof body.settings === "object") {
      for (const [key, value] of Object.entries(body.settings)) {
        if (key === "slack_url") {
          if (value === null || value === "") {
            delete next.slack_url;
            continue;
          }
          if (typeof value !== "string" || !isValidHttpUrl(value)) {
            return NextResponse.json(
              { error: "Team chat URL must start with http:// or https://" },
              { status: 400 },
            );
          }
          next.slack_url = value;
          continue;
        }
        // Unknown setting keys are written through (caller's
        // responsibility), but never overwritten with `undefined`.
        if (value !== undefined) next[key] = value;
      }
      updates.settings = next;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  const { data: updated, error } = await admin
    .from("events")
    .update(updates)
    .eq("id", eventId)
    .select(
      "id, title, description, welcome_message, welcome_video_url, vanity_slug, public_showcase, settings",
    )
    .single();

  if (error) {
    if (error.message?.includes("voting_close_after_open")) {
      return NextResponse.json(
        { error: "Voting must close after it opens." },
        { status: 400 },
      );
    }
    if (error.message?.includes("reflections_close_after_open")) {
      return NextResponse.json(
        { error: "Reflections must close after they open." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: updated });
}
