"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScreenshotUploader } from "./screenshot-uploader";
import { CharCounter } from "./char-counter";
import {
  IDEA_FIELD_LIMITS,
  statusLabel,
  type IdeaStatus,
  type IdeaWithAuthor,
} from "@/lib/idealab/types";
import { isValidHttpUrl } from "@/lib/idealab/url";

interface IdeaDetailProps {
  initialIdea: IdeaWithAuthor;
  eventId: string;
  isOwner: boolean;
}

/**
 * IdeaDetail — owner-editable detail view.
 *
 * Editing model:
 *   - The "What's the idea?" section (title / teaser / description) is
 *     a single editable block with a "Save changes" button at the
 *     bottom. PATCHes only the changed fields.
 *   - The "Show it off" section owns the live URL with its own
 *     "Save link" button — URL validation belongs next to the URL.
 *   - The screenshot uploader writes its URL + crop via its own
 *     PATCHes so the upload feels atomic and we don't lose state if
 *     the user navigates away mid-edit.
 *   - Status flip is its own action because the demo-ready validation
 *     (live_url + final_screenshot_url required for "Completed") needs
 *     a dedicated affordance with contextual error messaging.
 *
 * Non-owners get a read-only view + the gallery's back link.
 */
export function IdeaDetail({
  initialIdea,
  eventId,
  isOwner,
}: IdeaDetailProps) {
  const router = useRouter();
  const [idea, setIdea] = useState<IdeaWithAuthor>(initialIdea);
  const [title, setTitle] = useState(initialIdea.title);
  const [pitch, setPitch] = useState(initialIdea.pitch);
  const [description, setDescription] = useState(
    initialIdea.description ?? ""
  );
  const [liveUrl, setLiveUrl] = useState(initialIdea.liveUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [urlSavedFlash, setUrlSavedFlash] = useState(false);

  const planHref = `/plan?idea=${idea.id}&event=${eventId}&tool=lovable`;

  const hasDemoAssets = !!idea.liveUrl && !!idea.finalScreenshotUrl;
  const isCompleted = idea.status === "completed";

  /**
   * Build a patch with only the changed core fields (title, pitch,
   * description). Live URL has its own save button and is not part of
   * this patch.
   */
  function buildPatch(): Record<string, unknown> {
    const patch: Record<string, unknown> = {};
    if (title.trim() !== idea.title) patch.title = title.trim();
    if (pitch.trim() !== idea.pitch) patch.pitch = pitch.trim();
    const nextDescription = description.trim() || null;
    if (nextDescription !== idea.description)
      patch.description = nextDescription;
    return patch;
  }

  async function patchIdea(
    body: Record<string, unknown>
  ): Promise<IdeaWithAuthor | null> {
    const res = await fetch(`/api/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(json.error ?? `Update failed (${res.status})`);
    }
    const json = (await res.json()) as {
      idea: Omit<IdeaWithAuthor, "authorName">;
    };
    return { ...json.idea, authorName: idea.authorName };
  }

  function flashSaved() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function flashUrlSaved() {
    setUrlSavedFlash(true);
    setTimeout(() => setUrlSavedFlash(false), 1500);
  }

  async function handleSave() {
    if (!isOwner) return;
    setError(null);
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      flashSaved();
      return;
    }

    setSaving(true);
    try {
      const updated = await patchIdea(patch);
      if (updated) {
        setIdea(updated);
        flashSaved();
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLiveUrl() {
    if (!isOwner) return;
    setUrlError(null);
    const trimmed = liveUrl.trim();
    if (trimmed && !isValidHttpUrl(trimmed)) {
      setUrlError(
        "That doesn't look like a valid URL. Try something like https://your-build.lovable.app"
      );
      return;
    }

    setSavingUrl(true);
    try {
      const updated = await patchIdea({ liveUrl: trimmed || null });
      if (updated) {
        setIdea(updated);
        flashUrlSaved();
        router.refresh();
      }
    } catch (err) {
      setUrlError(
        err instanceof Error ? err.message : "Couldn't save your link."
      );
    } finally {
      setSavingUrl(false);
    }
  }

  async function handleStatusChange(next: IdeaStatus) {
    if (!isOwner || next === idea.status) return;
    setStatusError(null);

    if (next === "completed" && !hasDemoAssets) {
      setStatusError(
        "Add a live URL and a final screenshot before marking this Completed."
      );
      return;
    }

    setStatusSaving(true);
    try {
      const updated = await patchIdea({ status: next });
      if (updated) {
        setIdea(updated);
        router.refresh();
      }
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Status update failed."
      );
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleScreenshotUploaded(url: string) {
    try {
      // Reset the crop on a fresh upload — old focal-point on a new
      // image is meaningless.
      const updated = await patchIdea({
        finalScreenshotUrl: url,
        heroCropY: 50,
      });
      if (updated) {
        setIdea(updated);
        router.refresh();
      }
    } catch (err) {
      toast.error("Couldn't save your screenshot.", {
        description:
          err instanceof Error ? err.message : "Try again?",
      });
    }
  }

  async function handleCropChanged(cropY: number) {
    try {
      const updated = await patchIdea({ heroCropY: cropY });
      if (updated) {
        setIdea(updated);
        // No router.refresh here — crop changes are cheap and the
        // local mini-preview already reflects the change.
      }
    } catch (err) {
      toast.error("Couldn't save the crop position.", {
        description:
          err instanceof Error ? err.message : "Try again?",
      });
    }
  }

  async function handleScreenshotRemoved() {
    try {
      // Single PATCH: clear the URL + crop, and roll back the status
      // if it was Completed (otherwise the DB CHECK constraint blocks
      // the update because a Completed idea must have both assets).
      const wasCompleted = idea.status === "completed";
      const updated = await patchIdea({
        finalScreenshotUrl: null,
        heroCropY: 50,
        ...(wasCompleted ? { status: "in_progress" as IdeaStatus } : {}),
      });
      if (updated) {
        setIdea(updated);
        if (wasCompleted) {
          toast.info("Your idea is back to In Progress.");
        }
        router.refresh();
      }
    } catch (err) {
      toast.error("Couldn't remove the screenshot.", {
        description:
          err instanceof Error ? err.message : "Try again?",
      });
    }
  }

  // ============================================================
  // Read-only render (non-owner)
  // ============================================================
  if (!isOwner) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {idea.title}
            </h1>
            <Badge
              variant={isCompleted ? "default" : "outline"}
              className="shrink-0"
            >
              {statusLabel(idea.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {idea.authorName ?? "Anonymous"}
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            The teaser
          </h2>
          <p className="text-lg">{idea.pitch}</p>
        </section>

        {idea.description && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              More about it
            </h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {idea.description}
            </p>
          </section>
        )}

        {isCompleted && idea.liveUrl && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Live URL
            </h2>
            <a
              href={idea.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base underline underline-offset-4"
            >
              {idea.liveUrl}
            </a>
          </section>
        )}

        {isCompleted && idea.finalScreenshotUrl && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Final screenshot
            </h2>
            <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={idea.finalScreenshotUrl}
                alt={`${idea.title} screenshot`}
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `center ${idea.heroCropY ?? 50}%`,
                }}
              />
            </div>
          </section>
        )}
      </div>
    );
  }

  // ============================================================
  // Owner render (inline edit)
  // ============================================================
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Your idea</h1>
          <Badge
            variant={isCompleted ? "default" : "outline"}
            className="shrink-0"
          >
            {statusLabel(idea.status)}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Keep it fresh. Edit anything any time.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href={planHref}>Plan this build &rarr;</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          We&apos;ll hand it off to the Blueprint with your idea already
          loaded.
        </p>
      </div>

      <section className="space-y-5 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">What&apos;s the idea?</h2>
          <p className="text-sm text-muted-foreground">
            The basics. Change anything any time.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="title">What should we call it? *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={IDEA_FIELD_LIMITS.title}
            disabled={saving}
          />
          <CharCounter value={title} max={IDEA_FIELD_LIMITS.title} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="pitch">
            Give us the teaser &mdash; 140 characters or less *
          </Label>
          <Input
            id="pitch"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            maxLength={IDEA_FIELD_LIMITS.pitch}
            disabled={saving}
          />
          <CharCounter value={pitch} max={IDEA_FIELD_LIMITS.pitch} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Got more to say? Spill it here.</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={IDEA_FIELD_LIMITS.description}
            disabled={saving}
          />
          <CharCounter
            value={description}
            max={IDEA_FIELD_LIMITS.description}
          />
        </div>

        {error && (
          <div
            className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {savedFlash && (
            <span className="text-sm text-muted-foreground">Saved it.</span>
          )}
        </div>
      </section>

      <section className="space-y-5 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">Show it off</h2>
          <p className="text-sm text-muted-foreground">
            Your live link and a final screenshot. You need both before you
            can mark this Completed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="liveUrl">Live URL</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Input
              id="liveUrl"
              type="url"
              inputMode="url"
              value={liveUrl}
              onChange={(e) => {
                setLiveUrl(e.target.value);
                if (urlError) setUrlError(null);
              }}
              placeholder="https://your-build.lovable.app"
              disabled={savingUrl}
              className="sm:flex-1"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleSaveLiveUrl}
                disabled={savingUrl}
                variant="outline"
              >
                {savingUrl ? "Saving…" : "Save link"}
              </Button>
              {urlSavedFlash && (
                <span className="text-sm text-muted-foreground">
                  Saved it.
                </span>
              )}
            </div>
          </div>
          {urlError && (
            <p className="text-sm text-destructive" role="alert">
              {urlError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Final screenshot</Label>
          <ScreenshotUploader
            ideaId={idea.id}
            currentUrl={idea.finalScreenshotUrl}
            heroCropY={idea.heroCropY ?? 50}
            onUploaded={handleScreenshotUploaded}
            onCropChanged={handleCropChanged}
            onRemoved={handleScreenshotRemoved}
            disabled={saving}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">Where&apos;s it at?</h2>
          <p className="text-sm text-muted-foreground">
            Flip to <strong>Completed</strong> once your link and screenshot
            are in.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={idea.status}
            onValueChange={(v) => handleStatusChange(v as IdeaStatus)}
            disabled={statusSaving}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed" disabled={!hasDemoAssets}>
                Completed
              </SelectItem>
            </SelectContent>
          </Select>
          {statusSaving && (
            <span className="text-sm text-muted-foreground">Updating…</span>
          )}
        </div>

        {statusError && (
          <div
            className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {statusError}
          </div>
        )}
      </section>
    </div>
  );
}
