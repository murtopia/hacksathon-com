"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IDEA_FIELD_LIMITS } from "@/lib/idealab/types";
import { CharCounter } from "./char-counter";

interface IdeaFormProps {
  eventId: string;
}

/**
 * IdeaLab submission form. Posts to /api/ideas; on success redirects
 * to the detail/edit page so the participant can immediately keep
 * editing or kick off the Blueprint.
 *
 * Copy is intentionally playful — lifted from the original IdeaLab to
 * keep the IdeaLab feeling like the most fun room in the building.
 * Status is not exposed here; fresh submissions default to In Progress
 * and the detail view handles transitions.
 */
export function IdeaForm({ eventId }: IdeaFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!title.trim()) {
      setError("Give your idea a name first.");
      return;
    }
    if (!pitch.trim()) {
      setError("Drop a one-liner teaser before you submit.");
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
        <Label htmlFor="pitch">Give us the teaser &mdash; 140 characters or less *</Label>
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
        <Label htmlFor="description">Got more to say? Spill it here.</Label>
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
          {submitting ? "Dropping it…" : "Drop my idea"}
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
