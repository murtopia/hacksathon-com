"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IDEA_FIELD_LIMITS } from "@/lib/idealab/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { CharCounter } from "./char-counter";

interface IdeaFormProps {
  eventId: string;
  /**
   * Vanity slug for the event. When provided, on-success redirects go
   * to `/[slug]/idea` instead of the legacy `/events/[id]/idealab/...`
   * route. Optional so older call sites still compile.
   */
  slug?: string;
}

const IMAGE_BUCKET = "idea-screenshots";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

/**
 * IdeaLab submission form. Posts to /api/ideas; on success redirects
 * to the detail/edit page so the participant can immediately keep
 * editing or kick off the Blueprint.
 *
 * Copy is intentionally playful - lifted from the original IdeaLab to
 * keep the IdeaLab feeling like the most fun room in the building.
 * Status is not exposed here; fresh submissions default to In Progress
 * and the detail view handles transitions.
 *
 * Optional Idea image: a logo / sketch / screenshot can be attached at
 * any stage. We stage the file locally, create the idea first, then
 * upload to Supabase Storage under the new idea id and PATCH the URL
 * before redirecting - that way the gallery card has an image to show
 * straight away.
 */
export function IdeaForm({ eventId, slug }: IdeaFormProps) {
  const successPath = slug ? `/${slug}/idea` : null;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  function stageImage(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(
        "That file type isn't supported. Use a PNG, JPEG, WebP, or GIF.",
      );
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 5 MB or smaller.");
      return;
    }
    setError(null);
    setImageFile(file);
  }

  function clearImage() {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleImageDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) stageImage(file);
  }

  async function uploadStagedImage(ideaId: string): Promise<string | null> {
    if (!imageFile) return null;
    const supabase = createClient();
    const ext =
      imageFile.name.split(".").pop()?.toLowerCase() ||
      imageFile.type.split("/")[1] ||
      "png";
    const path = `${ideaId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });
    if (uploadError) {
      throw new Error(uploadError.message);
    }
    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!title.trim()) {
      setError("Give your idea a name first.");
      return;
    }
    if (!pitch.trim()) {
      setError("Add a one-liner teaser before you submit.");
      return;
    }
    if (!description.trim()) {
      setError("Add a bit more detail about your idea before you submit.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          title: title.trim(),
          pitch: pitch.trim(),
          description: description.trim(),
        }),
      });

      if (res.status === 409) {
        const body = (await res.json().catch(() => ({}))) as {
          existingIdeaId?: string;
        };
        if (body.existingIdeaId) {
          router.replace(
            successPath ?? `/events/${eventId}/idealab/${body.existingIdeaId}`,
          );
          return;
        }
        setError("You already have an idea in this event.");
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Failed to submit idea.");
        return;
      }

      const body = (await res.json()) as { idea: { id: string } };
      const ideaId = body.idea.id;

      if (imageFile) {
        try {
          const url = await uploadStagedImage(ideaId);
          if (url) {
            await fetch(`/api/ideas/${ideaId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ finalScreenshotUrl: url }),
            });
          }
        } catch (uploadErr) {
          // Image is optional; the idea row is already saved, so we
          // surface the failure but don't block the redirect to the
          // detail page where the user can retry the upload.
          console.error("[IdeaForm] image upload failed", uploadErr);
        }
      }

      router.replace(
        successPath ?? `/events/${eventId}/idealab/${ideaId}`,
      );
    } catch (err) {
      console.error("[IdeaForm] submit failed", err);
      setError("Network error. Try again?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <Label htmlFor="title">What should we call it? *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., AI-powered customer support that actually gets it"
          required
          disabled={submitting}
          maxLength={IDEA_FIELD_LIMITS.title}
        />
        <CharCounter value={title} max={IDEA_FIELD_LIMITS.title} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="pitch">Give us the teaser - 140 characters or less *</Label>
        <Input
          id="pitch"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="The one-liner that'll make everyone go 'wait, what?!'"
          required
          disabled={submitting}
          maxLength={IDEA_FIELD_LIMITS.pitch}
        />
        <CharCounter value={pitch} max={IDEA_FIELD_LIMITS.pitch} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Tell us more about your project *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dive deeper into your wild idea. What problem does it solve? How would it work? Why would it be amazing?"
          disabled={submitting}
          rows={5}
          maxLength={IDEA_FIELD_LIMITS.description}
        />
        <CharCounter value={description} max={IDEA_FIELD_LIMITS.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idea-image-upload">
          Idea image (optional for now, you can add this later)
        </Label>
        <p className="text-xs text-muted-foreground">
          Logo, sketch, mood board, screenshot - anything visual. You can
          add or replace this any time from the idea page.
        </p>

        {imagePreview ? (
          <div className="space-y-2">
            <div
              className="w-full overflow-hidden rounded-[4px] border bg-background"
              style={{ aspectRatio: "16 / 10" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Idea image preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={clearImage}
                disabled={submitting}
              >
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div
            id="idea-image-upload"
            role="button"
            tabIndex={0}
            aria-label="Add an idea image"
            aria-disabled={submitting}
            onClick={() => {
              if (!submitting) fileInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !submitting) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!submitting) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              if (submitting) return;
              handleImageDrop(e);
            }}
            className={cn(
              "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[4px] border border-border bg-background px-6 py-10 text-center transition-colors",
              dragOver && "border-foreground/60 bg-muted/40",
              submitting && "cursor-not-allowed opacity-60",
            )}
          >
            {submitting && imageFile ? (
              <>
                <Loader2
                  className="h-8 w-8 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium">Uploading image…</p>
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
                    PNG, JPG, WebP, or GIF - max 5 MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) stageImage(file);
          }}
          disabled={submitting}
          className="hidden"
        />
      </div>

      {error && (
        <p
          className="border-l-2 border-foreground/40 pl-3 font-serif text-sm italic text-foreground"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="pill" size="pill" disabled={submitting}>
          {submitting ? "Saving…" : "Save my idea"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={submitting}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
