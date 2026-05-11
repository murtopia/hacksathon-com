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
  /** Horizontal focal-point (0..100). Active when the image is wider than 16:9. */
  heroCropX: number;
  /** Vertical focal-point (0..100). Active when the image is taller than 16:9. */
  heroCropY: number;
  /** Called with the new public URL after a successful upload. */
  onUploaded: (url: string) => Promise<void> | void;
  /**
   * Called on drag-end (not on every move) to persist the new crop
   * value. Avoids one PATCH per pixel. Partial: only the axis the
   * uploader is driving will be present.
   */
  onCropChanged: (next: {
    heroCropX?: number;
    heroCropY?: number;
  }) => Promise<void> | void;
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
 * "Cropping" is intentionally CSS-only — we save `hero_crop_x` /
 * `hero_crop_y` percentages and let `object-position` move the visible
 * 16:9 window on the original image at render time. No image
 * processing pipeline, no Sharp, no edge function.
 *
 * Axis selection follows the natural aspect ratio: `object-cover` in a
 * 16:9 frame only crops one direction, so we pick the axis that's
 * actually meaningful. Images taller than 16:9 get a vertical band
 * (Y); wider get a horizontal band (X); exactly 16:9 gets no band at
 * all.
 *
 * Remove flow: delete the storage object, then call `onRemoved()` so
 * the parent can clear `final_screenshot_url`, reset both crops to
 * 50, and roll status back to `in_progress` if needed (the DB CHECK
 * constraint would otherwise block the screenshot clear on a Completed
 * idea).
 */
export function ScreenshotUploader({
  ideaId,
  currentUrl,
  heroCropX,
  heroCropY,
  onUploaded,
  onCropChanged,
  onRemoved,
  disabled,
}: ScreenshotUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  const savedFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localCropX, setLocalCropX] = useState(heroCropX);
  const [localCropY, setLocalCropY] = useState(heroCropY);
  const [isDragging, setIsDragging] = useState(false);
  const [savingCrop, setSavingCrop] = useState(false);
  const [cropSavedFlash, setCropSavedFlash] = useState(false);
  const [heroNaturalSize, setHeroNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  // Clear any pending "Saved." flash on unmount so we don't poke an
  // unmounted component if the user navigates away mid-flash.
  useEffect(() => {
    return () => {
      if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
    };
  }, []);

  // If the screenshot is already in the browser cache, the <img>'s
  // `load` event may fire before React attaches our `onLoad` handler
  // — leaving `heroNaturalSize` null and the crop tool stuck in the
  // "nothing to crop" state. Read the dimensions directly from the
  // ref whenever the URL changes, falling back to onLoad for fresh
  // loads.
  useEffect(() => {
    if (!currentUrl) return;
    const img = heroImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setHeroNaturalSize((prev) => {
        if (
          prev &&
          prev.w === img.naturalWidth &&
          prev.h === img.naturalHeight
        ) {
          return prev;
        }
        return { w: img.naturalWidth, h: img.naturalHeight };
      });
    }
  }, [currentUrl]);

  // Keep local crop in sync with the persisted values when the parent
  // pushes new ones (refresh, fresh upload that resets to 50, etc.).
  useEffect(() => {
    setLocalCropX(heroCropX);
  }, [heroCropX]);
  useEffect(() => {
    setLocalCropY(heroCropY);
  }, [heroCropY]);

  /**
   * Which axis is meaningful for this image. `object-cover` in a 16:9
   * frame crops only one direction — taller-than-16:9 crops vertically
   * (Y axis), wider-than-16:9 crops horizontally (X axis), exactly 16:9
   * doesn't crop at all so the focal point is moot.
   *
   * Before the image loads we default to "y" because most app
   * screenshots (phones, laptops) are taller than 16:9.
   */
  const cropAxis: "x" | "y" | null = useMemo(() => {
    if (!heroNaturalSize) return "y";
    const r = heroNaturalSize.w / heroNaturalSize.h;
    if (r > 16 / 9) return "x";
    if (r < 16 / 9) return "y";
    return null;
  }, [heroNaturalSize]);

  /**
   * Visible slice size along the active axis as a percentage of the
   * full image. For Y axis this is the slice height; for X axis it's
   * the slice width. Capped at 100 — when the image already fits the
   * 16:9 frame in that direction, there's nothing to crop.
   */
  const sliceSize = useMemo(() => {
    if (!heroNaturalSize || !cropAxis) return 100;
    const { w, h } = heroNaturalSize;
    if (cropAxis === "y") return Math.min(100, (9 / 16) * (w / h) * 100);
    return Math.min(100, (16 / 9) * (h / w) * 100);
  }, [heroNaturalSize, cropAxis]);

  /**
   * Band geometry on the source image. As the active crop value goes
   * 0..100, the band's leading edge linearly slides from 0% to
   * (100 - sliceSize)%, so the band always stays fully inside the
   * image — and the leading edge / size map exactly to the slice that
   * `object-cover` shows at the corresponding `object-position`.
   */
  const activeCrop = cropAxis === "x" ? localCropX : localCropY;
  const bandStart = (activeCrop * (100 - sliceSize)) / 100;
  const bandSize = sliceSize;

  const updateCropFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const container = cropContainerRef.current;
      if (!container) return;
      // No active axis (exactly 16:9) or the slice already covers the
      // full image — nothing to crop. Lock both axes at center.
      if (!cropAxis || sliceSize >= 100) {
        setLocalCropX(50);
        setLocalCropY(50);
        return;
      }
      const rect = container.getBoundingClientRect();
      const pointerPct =
        cropAxis === "y"
          ? ((clientY - rect.top) / rect.height) * 100
          : ((clientX - rect.left) / rect.width) * 100;
      // Solve so the band CENTER follows the pointer, then clamp to
      // [0, 100]. Pointer positions inside half-a-slice of an edge
      // park the band flush against that edge instead of overhanging.
      const next = Math.round(
        Math.max(
          0,
          Math.min(
            100,
            ((pointerPct - sliceSize / 2) * 100) / (100 - sliceSize)
          )
        )
      );
      if (cropAxis === "y") setLocalCropY(next);
      else setLocalCropX(next);
    },
    [cropAxis, sliceSize]
  );

  // Bind pointer move/up to the window while dragging so the drag
  // continues even if the pointer leaves the container.
  useEffect(() => {
    if (!isDragging) return;
    function onMove(e: PointerEvent) {
      updateCropFromPointer(e.clientX, e.clientY);
    }
    async function onUp() {
      setIsDragging(false);
      if (!cropAxis) return;
      // Surface the save in the UI so the user has something to look
      // at — silent auto-save reads as "did anything happen?".
      setSavingCrop(true);
      setCropSavedFlash(false);
      if (savedFlashTimer.current) {
        clearTimeout(savedFlashTimer.current);
        savedFlashTimer.current = null;
      }
      try {
        await onCropChanged(
          cropAxis === "y"
            ? { heroCropY: localCropY }
            : { heroCropX: localCropX }
        );
        setCropSavedFlash(true);
        savedFlashTimer.current = setTimeout(() => {
          setCropSavedFlash(false);
          savedFlashTimer.current = null;
        }, 1500);
      } catch (err) {
        toast.error("Couldn't save the crop position.", {
          description:
            err instanceof Error ? err.message : "Try again?",
        });
      } finally {
        setSavingCrop(false);
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [
    isDragging,
    cropAxis,
    localCropX,
    localCropY,
    onCropChanged,
    updateCropFromPointer,
  ]);

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
  const hasCrop = cropAxis !== null && sliceSize < 100;
  const helperCopy = !hasCrop
    ? "This image already fills the card. Nothing to crop."
    : cropAxis === "x"
      ? "Drag the highlighted strip left or right to choose what shows on the card."
      : "Drag the highlighted strip up or down to choose what shows on the card.";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{helperCopy}</p>
        {hasCrop && (savingCrop || cropSavedFlash) && (
          <span
            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {savingCrop ? (
              <>
                <Loader2
                  className="h-3 w-3 animate-spin"
                  aria-hidden="true"
                />
                Saving&hellip;
              </>
            ) : (
              "Saved."
            )}
          </span>
        )}
      </div>

      <div
        ref={cropContainerRef}
        onPointerDown={(e) => {
          if (disabled || !hasCrop) return;
          e.preventDefault();
          setIsDragging(true);
          updateCropFromPointer(e.clientX, e.clientY);
        }}
        className={cn(
          "relative w-full select-none overflow-hidden rounded-lg border bg-muted",
          disabled || !hasCrop
            ? "cursor-default"
            : cropAxis === "x"
              ? "cursor-ew-resize"
              : "cursor-ns-resize"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={heroImgRef}
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
        {hasCrop && cropAxis === "y" && (
          <>
            {/* Dim above and below the viewport band */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bg-background/55"
              style={{ height: `${bandStart}%` }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-background/55"
              style={{
                height: `${Math.max(0, 100 - (bandStart + bandSize))}%`,
              }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 border-y-2 border-foreground/80 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
              style={{
                top: `${bandStart}%`,
                height: `${bandSize}%`,
              }}
            />
          </>
        )}
        {hasCrop && cropAxis === "x" && (
          <>
            {/* Dim left and right of the viewport band */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 bg-background/55"
              style={{ width: `${bandStart}%` }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 bg-background/55"
              style={{
                width: `${Math.max(0, 100 - (bandStart + bandSize))}%`,
              }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 border-x-2 border-foreground/80 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
              style={{
                left: `${bandStart}%`,
                width: `${bandSize}%`,
              }}
            />
          </>
        )}
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
