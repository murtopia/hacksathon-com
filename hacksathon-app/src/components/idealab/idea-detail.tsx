"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  CATEGORIES,
  categoryLabel,
  statusLabel,
  type IdeaCategory,
  type IdeaStatus,
  type IdeaWithAuthor,
} from "@/lib/idealab/types";

interface IdeaDetailProps {
  initialIdea: IdeaWithAuthor;
  eventId: string;
  isOwner: boolean;
}

const NO_CATEGORY = "__none__";

/**
 * IdeaDetail — owner-editable detail view.
 *
 * Editing model:
 *   - All editable fields live in local state. The owner edits inline,
 *     and a single "Save changes" button PATCHes the diff.
 *   - Status toggle is its own action because the demo-ready
 *     validation (live_url + final_screenshot_url required for
 *     "Completed") is best surfaced as a dedicated affordance with
 *     contextual error messaging.
 *   - The screenshot uploader writes the URL via its own PATCH so the
 *     upload feels atomic and we don't lose state if the user navigates
 *     away mid-edit.
 *
 * Non-owners see a read-only view + the gallery's back link.
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
  const [category, setCategory] = useState<IdeaCategory | null>(
    initialIdea.category
  );
  const [liveUrl, setLiveUrl] = useState(initialIdea.liveUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const planHref = `/plan?idea=${idea.id}&event=${eventId}&tool=lovable`;

  const hasDemoAssets = !!idea.liveUrl && !!idea.finalScreenshotUrl;
  const isCompleted = idea.status === "completed";

  /**
   * Build a patch with only the fields that actually changed. Avoids
   * sending no-op fields and keeps the PATCH small.
   */
  function buildPatch(): Record<string, unknown> {
    const patch: Record<string, unknown> = {};
    if (title.trim() !== idea.title) patch.title = title.trim();
    if (pitch.trim() !== idea.pitch) patch.pitch = pitch.trim();
    const nextDescription = description.trim() || null;
    if (nextDescription !== idea.description) patch.description = nextDescription;
    if (category !== idea.category) patch.category = category;
    const nextLiveUrl = liveUrl.trim() || null;
    if (nextLiveUrl !== idea.liveUrl) patch.liveUrl = nextLiveUrl;
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

  async function handleSave() {
    if (!isOwner) return;
    setError(null);
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      return;
    }

    setSaving(true);
    try {
      const updated = await patchIdea(patch);
      if (updated) {
        setIdea(updated);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
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
      const updated = await patchIdea({ finalScreenshotUrl: url });
      if (updated) {
        setIdea(updated);
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save screenshot URL."
      );
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
            {idea.category && (
              <>
                {" · "}
                {categoryLabel(idea.category)}
              </>
            )}
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            One-line pitch
          </h2>
          <p className="text-lg">{idea.pitch}</p>
        </section>

        {idea.description && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Details
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={idea.finalScreenshotUrl}
              alt={`${idea.title} screenshot`}
              className="aspect-video w-full rounded-md border object-cover"
            />
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
          Keep this card up to date as your build evolves.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href={planHref}>Plan this build →</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Launches the Blueprint with this idea pre-loaded.
        </p>
      </div>

      <section className="space-y-5 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Idea details</h2>

        <div className="space-y-2">
          <Label htmlFor="title">Project name</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pitch">What does it do?</Label>
          <Input
            id="pitch"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            maxLength={200}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={category ?? NO_CATEGORY}
            onValueChange={(v) =>
              setCategory(v === NO_CATEGORY ? null : (v as IdeaCategory))
            }
            disabled={saving}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Pick one (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>No category</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Tell us more</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            disabled={saving}
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
            <span className="text-sm text-muted-foreground">Saved.</span>
          )}
        </div>
      </section>

      <section className="space-y-5 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">Demo assets</h2>
          <p className="text-sm text-muted-foreground">
            You need both a live URL and a final screenshot before this idea can
            be marked Completed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="liveUrl">Live URL</Label>
          <Input
            id="liveUrl"
            type="url"
            inputMode="url"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            placeholder="https://your-build.lovable.app"
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            Click <em>Save changes</em> above to persist your URL.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Final screenshot</Label>
          <ScreenshotUploader
            eventId={eventId}
            userId={idea.userId}
            currentUrl={idea.finalScreenshotUrl}
            onUploaded={handleScreenshotUploaded}
            disabled={saving}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">Status</h2>
          <p className="text-sm text-muted-foreground">
            Flip to <strong>Completed</strong> once your live URL and screenshot
            are in place.
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
