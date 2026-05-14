"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventBasicsSectionProps {
  eventId: string;
  initialTitle: string;
  initialDescription: string;
  initialWelcomeMessage: string;
  initialWelcomeVideoUrl: string;
  isLocked: boolean;
}

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 5000;
const WELCOME_MAX = 2000;

/**
 * Edit the headline event fields: title, description, welcome message,
 * welcome video URL. Single Save button — no per-field autosave because
 * organizers usually tweak multiple of these at once and we don't want
 * five toasts in a row.
 *
 * When the event is locked, every field is read-only with a small
 * "locked" note. The participant home keeps rendering whatever the
 * organizer wrote pre-lock.
 */
export function EventBasicsSection({
  eventId,
  initialTitle,
  initialDescription,
  initialWelcomeMessage,
  initialWelcomeVideoUrl,
  isLocked,
}: EventBasicsSectionProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage);
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState(initialWelcomeVideoUrl);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty =
    title !== initialTitle ||
    description !== initialDescription ||
    welcomeMessage !== initialWelcomeMessage ||
    welcomeVideoUrl !== initialWelcomeVideoUrl;

  function handleSave() {
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          welcome_message: welcomeMessage.trim() || null,
          welcome_video_url: welcomeVideoUrl.trim() || null,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save event basics.");
        return;
      }
      toast.success("Saved.");
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <Card id="basics">
      <CardHeader>
        <CardTitle className="text-base">Event basics</CardTitle>
        <CardDescription>
          The title participants see, plus the welcome copy and optional intro
          video on their event home.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="basics-title">Event title</Label>
          <Input
            id="basics-title"
            value={title}
            disabled={isLocked || pending}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="Spring Hacks-a-Thon"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="basics-description">
            Internal description{" "}
            <span className="font-normal text-muted-foreground">
              (not shown to participants)
            </span>
          </Label>
          <Textarea
            id="basics-description"
            value={description}
            disabled={isLocked || pending}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESCRIPTION_MAX}
            rows={3}
            placeholder="What this event is, who's running it, any notes for yourself."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="basics-welcome">Welcome message</Label>
          <Textarea
            id="basics-welcome"
            value={welcomeMessage}
            disabled={isLocked || pending}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            maxLength={WELCOME_MAX}
            rows={3}
            placeholder="Shown on every participant's event home above the block list."
          />
          <p className="text-xs text-muted-foreground">
            Keep it short — one or two lines lands best.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="basics-video">Welcome video URL (optional)</Label>
          <Input
            id="basics-video"
            type="url"
            value={welcomeVideoUrl}
            disabled={isLocked || pending}
            onChange={(e) => setWelcomeVideoUrl(e.target.value)}
            placeholder="https://www.loom.com/share/…"
          />
          <p className="text-xs text-muted-foreground">
            Pasted Loom / YouTube / Vimeo links embed automatically.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!dirty || pending || isLocked}>
          <Save className="mr-2 size-4" />
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {savedAt && !dirty && !pending && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3" />
            Saved
          </span>
        )}
        {isLocked && (
          <span className="text-xs text-muted-foreground">
            Event is locked — basics can&apos;t be changed.
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
