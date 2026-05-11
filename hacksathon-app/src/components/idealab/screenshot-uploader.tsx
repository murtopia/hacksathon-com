"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "idea-screenshots";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB; arbitrary cap, plenty for a screenshot

interface ScreenshotUploaderProps {
  eventId: string;
  userId: string;
  currentUrl: string | null;
  /** Called with the new public URL after a successful upload. */
  onUploaded: (url: string) => Promise<void> | void;
  disabled?: boolean;
}

/**
 * ScreenshotUploader — direct client → Supabase Storage upload using
 * the authenticated user's session. The path convention is
 *
 *     {eventId}/{userId}/screenshot.{ext}
 *
 * which is enforced by the bucket's RLS policies (see 00007 migration).
 * The same path is reused on re-upload (`upsert: true`) so each user
 * only ever has one file per event, keeping storage tidy.
 *
 * After upload, the parent persists the public URL to
 * `ideas.final_screenshot_url` via the PATCH /api/ideas/[id] route.
 */
export function ScreenshotUploader({
  eventId,
  userId,
  currentUrl,
  onUploaded,
  disabled,
}: ScreenshotUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (file.size > MAX_BYTES) {
      setError("Screenshot must be 8 MB or smaller.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      // Normalize extension; fall back to .png if MIME doesn't carry one.
      const extFromName = file.name.split(".").pop()?.toLowerCase();
      const ext =
        extFromName && extFromName.length <= 5
          ? extFromName
          : file.type.split("/")[1] || "png";
      const path = `${eventId}/${userId}/screenshot.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      // Append a cache-buster so the freshly-uploaded image actually
      // shows up. Browsers will otherwise serve the previous file from
      // cache because the URL is unchanged.
      const url = `${publicUrlData.publicUrl}?v=${Date.now()}`;
      await onUploaded(url);
    } catch (err) {
      console.error("[ScreenshotUploader] upload failed", err);
      setError("Upload failed. Try again?");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt="Final screenshot"
          className="aspect-video w-full rounded-md border object-cover"
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
        disabled={disabled || uploading}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={currentUrl ? "outline" : "default"}
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading
            ? "Uploading…"
            : currentUrl
              ? "Replace screenshot"
              : "Upload screenshot"}
        </Button>
        {!currentUrl && (
          <p className="text-xs text-muted-foreground">
            PNG / JPG / WebP, up to 8 MB.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
