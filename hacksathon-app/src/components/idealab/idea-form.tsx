"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { CATEGORIES, type IdeaCategory } from "@/lib/idealab/types";

interface IdeaFormProps {
  eventId: string;
}

const NO_CATEGORY = "__none__";

/**
 * IdeaLab submission form. Posts to /api/ideas; on success redirects
 * to the detail/edit page so the participant can immediately keep
 * editing or kick off the Blueprint.
 *
 * Status is intentionally not exposed here — fresh submissions default
 * to In Progress and the detail view handles transitions.
 */
export function IdeaForm({ eventId }: IdeaFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [category, setCategory] = useState<IdeaCategory | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!title.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!pitch.trim()) {
      setError("Tell us what it does (one sentence) is required.");
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
          category,
          description: description.trim() || null,
        }),
      });

      if (res.status === 409) {
        // Duplicate — already has an idea in this event. Send the user
        // straight to it so they can pick up where they left off.
        const body = (await res.json().catch(() => ({}))) as {
          existingIdeaId?: string;
        };
        if (body.existingIdeaId) {
          router.replace(
            `/events/${eventId}/idealab/${body.existingIdeaId}`
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
      router.replace(`/events/${eventId}/idealab/${body.idea.id}`);
    } catch (err) {
      console.error("[IdeaForm] submit failed", err);
      setError("Network error. Try again?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Project name *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's it called?"
          required
          disabled={submitting}
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pitch">What does it do? *</Label>
        <Input
          id="pitch"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="One sentence."
          required
          disabled={submitting}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          One sentence is plenty. You can flesh it out below.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={category ?? NO_CATEGORY}
          onValueChange={(v) =>
            setCategory(v === NO_CATEGORY ? null : (v as IdeaCategory))
          }
          disabled={submitting}
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
          placeholder="Optional. Who's it for, what problem it solves, anything else."
          disabled={submitting}
          rows={4}
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
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit idea"}
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
