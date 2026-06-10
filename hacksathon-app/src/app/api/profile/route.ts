import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 15;

/**
 * Owner-only profile mutations.
 *
 * Path sits at /api/profile (singular) because the request is always
 * implicitly scoped to the authenticated caller's own profile - no id
 * in the URL.
 *
 * PATCH accepts any subset of `{ avatar_url, full_name }`. Sending both
 * in one call is fine; sending neither is a 200 noop so the client can
 * dispatch optimistically.
 *
 *   - `avatar_url` must point at the public Supabase storage host for
 *     the `avatars` bucket (defense in depth - the storage RLS
 *     policies already gate writes by `auth.uid()` folder).
 *   - `full_name` trims, requires 1–120 chars after trim.
 *
 * DELETE clears `avatar_url`. It does not best-effort prune the
 * storage object here; the upload UI overwrites a known filename and
 * the bucket is small, so orphaned blobs aren't a meaningful concern.
 */

const FULL_NAME_MAX = 120;

interface UpdatePayload {
  avatar_url?: string | null;
  full_name?: string | null;
}

function isAllowedAvatarUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return url.pathname.includes("/storage/v1/object/public/avatars/");
  } catch {
    return false;
  }
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdatePayload;
  try {
    body = (await req.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Build the update record from whichever fields the caller sent.
  // Sending an empty body / no recognized keys is a 200 noop so the
  // client can fire-and-forget without coordination.
  const patch: { avatar_url?: string | null; full_name?: string } = {};

  if ("avatar_url" in body) {
    if (body.avatar_url === null) {
      patch.avatar_url = null;
    } else if (typeof body.avatar_url === "string") {
      const trimmed = body.avatar_url.trim();
      if (trimmed.length === 0) {
        patch.avatar_url = null;
      } else if (!isAllowedAvatarUrl(trimmed)) {
        return NextResponse.json(
          { error: "avatar_url must be a Supabase avatars bucket URL." },
          { status: 400 },
        );
      } else {
        patch.avatar_url = trimmed;
      }
    } else {
      return NextResponse.json(
        { error: "avatar_url must be a string or null." },
        { status: 400 },
      );
    }
  }

  if ("full_name" in body) {
    if (typeof body.full_name !== "string") {
      return NextResponse.json(
        { error: "full_name must be a string." },
        { status: 400 },
      );
    }
    const trimmed = body.full_name.trim();
    if (trimmed.length < 1) {
      return NextResponse.json(
        { error: "Please tell us what to call you." },
        { status: 400 },
      );
    }
    if (trimmed.length > FULL_NAME_MAX) {
      return NextResponse.json(
        { error: `Name must be ${FULL_NAME_MAX} characters or fewer.` },
        { status: 400 },
      );
    }
    patch.full_name = trimmed;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("id, full_name, avatar_url")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Keep auth user metadata in sync so anywhere we surface
  // user_metadata.full_name (auth-form sign-up data, JWT claims) reads
  // the same source of truth as the profiles table.
  if (typeof patch.full_name === "string") {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { full_name: patch.full_name },
    });
  }

  return NextResponse.json({ ok: true, profile: updated });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id)
    .select("id, full_name, avatar_url")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: updated });
}
