"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { CharCounter } from "@/components/idealab/char-counter";

interface EventWelcomeSectionProps {
  eventId: string;
  initialWelcomeMessage: string;
  initialWelcomeVideoUrl: string;
  isLocked: boolean;
  number?: string;
}

const WELCOME_MAX = 2000;

/**
 * Suggested starter copy pre-filled when an event has no welcome message
 * yet. Admins can keep it as-is, rewrite it in their own voice, or clear
 * it - it's only a starting point, not a forced default.
 */
const DEFAULT_WELCOME_MESSAGE =
  "Welcome to your Hacks-a-Thon! You have free rein to build any kind of project you're passionate about. It doesn't even have to relate to our day-to-day work, just something you genuinely care about. We can't wait to see what you create.";

/**
 * Participant-facing welcome copy and an optional intro video URL.
 * Lives next to `EventTitleSection` on the Identity tab so admins can
 * compose "what this event is" in one place.
 */
export function EventWelcomeSection({
  eventId,
  initialWelcomeMessage,
  initialWelcomeVideoUrl,
  isLocked,
  number = "03",
}: EventWelcomeSectionProps) {
  const router = useRouter();
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialWelcomeMessage || DEFAULT_WELCOME_MESSAGE,
  );
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState(initialWelcomeVideoUrl);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty =
    welcomeMessage !== initialWelcomeMessage ||
    welcomeVideoUrl !== initialWelcomeVideoUrl;

  function handleSave() {
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcome_message: welcomeMessage.trim() || null,
          welcome_video_url: welcomeVideoUrl.trim() || null,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save welcome.");
        return;
      }
      toast.success("Saved.");
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <AdminSection
      id="welcome"
      number={number}
      title="Welcome"
      intent="The message - and optional video - that greets participants on their event home."
      footer={
        <>
          <Button variant="pill" size="pill" onClick={handleSave} disabled={!dirty || pending || isLocked}>
            <Save />
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {savedAt && !dirty && !pending && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3" />
              Saved
            </span>
          )}
          {isLocked && (
            <span className="font-serif text-xs italic text-muted-foreground">
              Event is locked - welcome can&apos;t be changed.
            </span>
          )}
        </>
      }
    >
      <AdminField
        label="Welcome message"
        htmlFor="welcome-message"
        hint="Shown on every participant's event home. We've added a starter you can keep, rewrite, or clear."
      >
        <Textarea
          id="welcome-message"
          value={welcomeMessage}
          disabled={isLocked || pending}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          maxLength={WELCOME_MAX}
          rows={4}
          placeholder="Shown on every participant's event home above the block list."
        />
        <CharCounter value={welcomeMessage} max={WELCOME_MAX} />
      </AdminField>

      <AdminField
        label="Welcome video URL"
        htmlFor="welcome-video"
        hint="Optional. Pasted Loom, YouTube, or Vimeo links embed automatically."
      >
        <Input
          id="welcome-video"
          type="url"
          value={welcomeVideoUrl}
          disabled={isLocked || pending}
          onChange={(e) => setWelcomeVideoUrl(e.target.value)}
          placeholder="https://www.loom.com/share/…"
        />
      </AdminField>
    </AdminSection>
  );
}
