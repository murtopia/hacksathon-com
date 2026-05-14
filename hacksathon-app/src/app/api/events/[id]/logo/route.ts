import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";

export const maxDuration = 30;

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

/**
 * Upload (or replace) the event logo. Admin-only.
 *
 * Accepts multipart/form-data with a single `file` field. Writes to the
 * event-logos bucket at {eventId}/{uuid}.{ext}, updates events.logo_url
 * to the public URL, and deletes the previously-stored logo (best
 * effort).
 *
 * 5 MB cap, PNG / JPEG / WebP / SVG only. SVG is included because most
 * companies have a flat SVG logo file at the ready.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ACCEPTED.has(file.type)) {
    return NextResponse.json(
      { error: "Logo must be PNG, JPEG, WebP, or SVG." },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Logo must be under 5 MB." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("events")
    .select("logo_url")
    .eq("id", eventId)
    .single<{ logo_url: string | null }>();

  const ext =
    file.type === "image/svg+xml"
      ? "svg"
      : file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/webp"
          ? "webp"
          : "png";
  const path = `${eventId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("event-logos")
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("event-logos").getPublicUrl(path);

  const { error: updateError } = await admin
    .from("events")
    .update({ logo_url: publicUrl })
    .eq("id", eventId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    );
  }

  // Best-effort cleanup of the previous logo file. Failure here is a
  // small storage leak, not a correctness issue.
  if (current?.logo_url) {
    const prefix = "/storage/v1/object/public/event-logos/";
    const idx = current.logo_url.indexOf(prefix);
    if (idx !== -1) {
      const oldPath = current.logo_url.substring(idx + prefix.length);
      await admin.storage.from("event-logos").remove([oldPath]);
    }
  }

  return NextResponse.json({ ok: true, logo_url: publicUrl });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("events")
    .select("logo_url")
    .eq("id", eventId)
    .single<{ logo_url: string | null }>();

  if (current?.logo_url) {
    const prefix = "/storage/v1/object/public/event-logos/";
    const idx = current.logo_url.indexOf(prefix);
    if (idx !== -1) {
      const oldPath = current.logo_url.substring(idx + prefix.length);
      await admin.storage.from("event-logos").remove([oldPath]);
    }
  }

  const { error } = await admin
    .from("events")
    .update({ logo_url: null })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
