"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const BUCKET = "idea-screenshots";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];
const PUBLIC_URL_PREFIX = "/storage/v1/object/public/idea-screenshots/";

interface ScreenshotUploaderProps {
  /** Parent ideas.id — drives the storage path and RLS check. */
  ideaId: string;
  /** Current persisted screenshot URL, or null when empty. */
  currentUrl: string | null;
  /**
   * Vertical focal-point (0..100). Used both for the live mini-preview
   * here and on the gallery card. 50 = center.
   */
  heroCropY: number;
  /** Called with the new public URL after a successful upload. */
  onUploaded: (url: string) => Promise<void> | void;
  /**
   * Called on drag-end (not on every move) to persist the new crop
   * value. Avoids one PATCH per pixel.
   */
  onCropChanged: (cropY: number) => Promise<void> | void;
  /**
   * Called after the storage file is deleted. Parent is responsible
   * for clearing the URL + crop in a single PATCH and (if the idea
   * was Completed) flipping status back to In Progress.
   */
  onRemoved: () => Promise<void> | void;
  disabled?: boolean;
}

/**
 * ScreenshotUploader — direct client → Supabase Storage upload with a
 * focal-point crop tool.
 *
 * Storage layout: `{ideaId}/{uuid}.{ext}` in the public `idea-screenshots`
 * bucket. RLS (00011) gates writes by `ideas.user_id`. UUID filenames
 * make every upload unique by construction, so we never need `upsert`
 * or a cache-buster query param.
 *
 * "Cropping" is intentionally CSS-only — we save a `hero_crop_y`
 * percentage and let `object-position` move the visible 16:9 window on
 * the original image at render time. No image processing pipeline, no
 * Sharp, no edge function.
 *
 * Remove flow: delete the storage object, then call `onRemoved()` so
 * the parent can clear `final_screenshot_url`, reset `hero_crop_y` to
 * 50, and roll status back to `in_progress` if needed (the DB CHECK
 * constraint would otherwise block the screenshot clear on a Completed
 * idea).
 */
export function ScreenshotUploader({
  ideaId,
  currentUrl,
  heroCropY,
  onUploaded,
  onCropChanged,
  onRemoved,
  disabled,
}: ScreenshotUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localCropY, setLocalCropY] = useState(heroCropY);
  const [isDragging, setIsDragging] = useState(false);
  const [heroNaturalSize, setHeroNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  // Keep local crop in sync with the persisted value when the parent
  // pushes a new one (e.g. after a refresh or on a freshly-uploaded
  // screenshot that resets to 50).
  useEffect(() => {
    setLocalCropY(heroCropY);
  }, [heroCropY]);

  /**
   * Visible slice height as a percentage of the full image. This is
   * what `object-cover` will reveal on the 16:9 card given the
   * image's natural aspect ratio. Falls back to a reasonable default
   * before the image loads. Capped at 100 — for images already wider
   * than 16:9, the full vertical range is visible and Y is a no-op.
   */
  const sliceH = useMemo(() => {
    if (!heroNaturalSize) return 30;
    const pct =
      (9 / 16) * (heroNaturalSize.w / heroNaturalSize.h) * 100;
    return Math.min(100, pct);
  }, [heroNaturalSize]);

  /**
   * Band geometry on the source image. As Y goes 0..100, the band's
   * top edge linearly slides from 0% to (100 - sliceH)%, so the band
   * always stays fully inside the image bounds — and `bandTop` /
   * `bandHeight` map exactly to the slice that `object-cover` shows
   * at `object-position: center {Y}%`.
   */
  const bandTop = (localCropY * (100 - sliceH)) / 100;
  const bandHeight = sliceH;

  const updateCropFromPointer = useCallback(
    (clientY: number) => {
      const container = cropContainerRef.current;
      if (!container) return;
      // Wide-or-16:9 image: there's nothing to crop vertically. Lock
      // the focal point at center; the band already covers the whole
      // image so dragging would be a visual no-op.
      if (sliceH >= 100) {
        setLocalCropY(50);
        return;
      }
      const rect = container.getBoundingClientRect();
      const pointerPct =
        ((clientY - rect.top) / rect.height) * 100;
      // Solve for Y such that the band CENTER follows the pointer,
      // then clamp to [0, 100]. The clamp is what keeps the band from
      // overhanging the top or bottom of the image: pointer positions
      // closer than sliceH/2 to an edge map to Y=0 or Y=100, parking
      // the band flush against that edge.
      const y =
        ((pointerPct - sliceH / 2) * 100) / (100 - sliceH);
      setLocalCropY(Math.round(Math.max(0, Math.min(100, y))));
    },
    [sliceH]
  );

  // Bind pointer move/up to the window while dragging so the drag
  // continues even if the pointer leaves the container.
  useEffect(() => {
    if (!isDragging) return;
    function onMove(e: PointerEvent) {
      updateCropFromPointer(e.clientY);
    }
    async function onUp() {
      setIsDragging(false);
      try {
        await onCropChanged(localCropY);
      } catch (err) {
        toast.error("Couldn't save the crop position.", {
          description:
            err instanceof Error ? err.message : "Try again?",
        });
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, localCropY, onCropChanged, updateCropFromPointer]);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description: `${file.name} is not a supported image format.`,
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: `${file.name} exceeds the 5 MB limit.`,
      });
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      // Always use a UUID + the file's real extension so two uploads
      // never collide and URLs are immutable per upload.
      const ext =
        file.name.split(".").pop()?.toLowerCase() ||
        file.type.split("/")[1] ||
        "png";
      const path = `${ideaId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        toast.error("Upload failed", {
          description: uploadError.message,
        });
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await onUploaded(data.publicUrl);
    } catch (err) {
      console.error("[ScreenshotUploader] upload failed", err);
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Try again?",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!currentUrl) return;
    setRemoving(true);
    try {
      const supabase = createClient();
      const idx = currentUrl.indexOf(PUBLIC_URL_PREFIX);
      if (idx !== -1) {
        const storagePath = currentUrl.substring(
          idx + PUBLIC_URL_PREFIX.length
        );
        // Strip any query string just in case (older URLs had ?v=…).
        const cleanPath = storagePath.split("?")[0];
        await supabase.storage.from(BUCKET).remove([cleanPath]);
      }
      await onRemoved();
    } catch (err) {
      console.error("[ScreenshotUploader] remove failed", err);
      toast.error("Couldn't remove the screenshot.", {
        description: err instanceof Error ? err.message : "Try again?",
      });
    } finally {
      setRemoving(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  // ============================================================
  // Empty state — drop zone
  // ============================================================
  if (!currentUrl) {
    return (
      <div className="space-y-3">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a screenshot"
          aria-disabled={disabled || uploading}
          onClick={() => {
            if (!disabled && !uploading) fileInputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (
              (e.key === "Enter" || e.key === " ") &&
              !disabled &&
              !uploading
            ) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            if (disabled || uploading) return;
            handleDrop(e);
          }}
          className={cn(
            "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-muted/30 px-6 py-10 text-center transition-colors",
            dragOver && "border-foreground/60 bg-muted/60",
            (disabled || uploading) &&
              "cursor-not-allowed opacity-60"
          )}
        >
          {uploading ? (
            <>
              <Loader2
                className="h-8 w-8 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">Uploading…</p>
            </>
          ) : (
            <>
              <UploadCloud
                className="h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">
                  Drop image here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, WebP or GIF &mdash; max 5 MB
                </p>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          disabled={disabled || uploading}
          className="hidden"
        />
      </div>
    );
  }

  // ============================================================
  // Loaded state — crop tool (with overlay band) + Replace / Remove
  // ============================================================
  //
  // The crop tool is the preview. The band overlay on the full image
  // already communicates exactly what the gallery card will show, so
  // we don't duplicate that as a separate hero thumbnail or mini
  // preview — those added noise without new information.
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Drag the highlighted strip up or down to choose what shows on
        the card.
      </p>

      <div
        ref={cropContainerRef}
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragging(true);
          updateCropFromPointer(e.clientY);
        }}
        className={cn(
          "relative w-full select-none overflow-hidden rounded-lg border bg-muted",
          disabled ? "cursor-not-allowed" : "cursor-ns-resize"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentUrl}
          alt="Screenshot"
          className="block w-full"
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            setHeroNaturalSize({
              w: img.naturalWidth,
              h: img.naturalHeight,
            });
          }}
        />
        {/* Dim the area outside the viewport band */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 bg-background/55"
          style={{ height: `${bandTop}%` }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-background/55"
          style={{ height: `${Math.max(0, 100 - (bandTop + bandHeight))}%` }}
        />
        {/* The viewport band itself */}
        <div
          className="pointer-events-none absolute inset-x-0 border-y-2 border-foreground/80 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
          style={{
            top: `${bandTop}%`,
            height: `${bandHeight}%`,
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || removing}
        >
          {uploading ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Uploading…
            </>
          ) : (
            "Replace"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRemove}
          disabled={disabled || uploading || removing}
        >
          {removing ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Removing…
            </>
          ) : (
            <>
              <X className="mr-2 h-4 w-4" aria-hidden="true" />
              Remove
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
        disabled={disabled || uploading || removing}
        className="hidden"
      />
    </div>
  );
}
